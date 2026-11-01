import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inspect } from "node:util";
import { pathToFileURL } from "node:url";
import { z } from "zod/v4";

/*
 * Variables de entorno:
 *   OLLAMA_BASE_URL   URL base de Ollama (por defecto OPENAI_BASE_URL o http://10.100.22.105:7869/v1)
 *   OLLAMA_MODEL      Modelo a usar (por defecto qwen3.5:4b)
 *   OLLAMA_NUM_CTX    Contexto del modelo (por defecto 32768)
 *   OLLAMA_MAX_TOKENS Tokens máximos de salida (por defecto 2048)
 *   OLLAMA_TIMEOUT_MS Tiempo máximo por petición en ms (por defecto 300000)
 *   OLLAMA_THINK      "true" para permitir razonamiento (por defecto desactivado)
 *   OLLAMA_API        "native", "openai" o "auto" (por defecto auto)
 *   MAX_ACT_STEPS     Pasos máximos para completar la tarea (por defecto 8)
 *   DEBUG_LLM         "1" para volcar peticiones/respuestas completas
 */

const configuredBaseUrl = (
  process.env.OLLAMA_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "http://10.100.22.105:7869/v1"
).replace(/\/+$/, "");

const OLLAMA_BASE_URL = configuredBaseUrl.replace(/\/v1$/, "");
const OLLAMA_OPENAI_URL = /\/v1$/.test(configuredBaseUrl)
  ? configuredBaseUrl
  : `${OLLAMA_BASE_URL}/v1`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:4b";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY ?? process.env.OPENAI_API_KEY;
const OLLAMA_NUM_CTX = toPositiveInt(process.env.OLLAMA_NUM_CTX, 32768);
const OLLAMA_MAX_TOKENS = toPositiveInt(process.env.OLLAMA_MAX_TOKENS, 2048);
const OLLAMA_TIMEOUT_MS = toPositiveInt(process.env.OLLAMA_TIMEOUT_MS, 300000);
const OLLAMA_API = process.env.OLLAMA_API ?? "auto";
const THINKING_ENABLED = process.env.OLLAMA_THINK === "true";
const DEBUG_LLM = process.env.DEBUG_LLM === "1";
const MAX_ACT_STEPS = toPositiveInt(process.env.MAX_ACT_STEPS, 8);

const JSON_ONLY_INSTRUCTION =
  "Return ONLY the requested JSON. Do not think step by step. Do not write explanations, markdown or text outside the JSON.";

const secrets = new Set();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function registerSecret(value) {
  if (typeof value === "string" && value.length > 0) {
    secrets.add(value);
  }
}

function redact(value) {
  let text =
    typeof value === "string"
      ? value
      : inspect(value, { depth: null, colors: true, compact: false });

  for (const secret of secrets) {
    text = text.split(secret).join("***");
  }

  return text;
}

function logStep(message) {
  console.log(`\n[STEP] ${message}`);
}

function logInfo(message) {
  console.log(`[INFO] ${message}`);
}

function logDeep(label, data) {
  if (!DEBUG_LLM) {
    return;
  }
  console.log(label, redact(data));
}

class OllamaHttpError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "OllamaHttpError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Utilidades de mensajes / JSON
// ---------------------------------------------------------------------------

function contentToText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

function normalizeContent(content) {
  if (content === undefined || content === null) {
    return [];
  }
  return Array.isArray(content) ? content : [content];
}

function toInternalMessages(params) {
  const messages = [];

  const systemParts = [];
  if (params.responseFormat?.type === "json_schema") {
    systemParts.push(JSON_ONLY_INSTRUCTION);
  }
  if (params.systemPrompt) {
    systemParts.push(params.systemPrompt);
  }
  if (systemParts.length > 0) {
    messages.push({ role: "system", text: systemParts.join("\n\n"), images: [] });
  }

  for (const message of params.messages ?? []) {
    const textParts = [];
    const images = [];

    for (const block of normalizeContent(message.content)) {
      if (!block || typeof block !== "object") {
        continue;
      }

      if (block.type === "text" && typeof block.text === "string") {
        textParts.push(block.text);
      } else if (block.type === "image" && typeof block.data === "string") {
        images.push({ data: block.data, mimeType: block.mimeType ?? "image/png" });
      }
    }

    const text = textParts.join("\n");
    if (text.length === 0 && images.length === 0) {
      continue;
    }

    messages.push({ role: message.role, text, images });
  }

  return messages;
}

function toOpenAIMessages(messages) {
  return messages.map((message) => {
    const parts = [];
    if (message.text) {
      parts.push({ type: "text", text: message.text });
    }
    for (const image of message.images) {
      parts.push({
        type: "image_url",
        image_url: { url: `data:${image.mimeType};base64,${image.data}` },
      });
    }
    return { role: message.role, content: parts };
  });
}

function toNativeMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.text,
    ...(message.images.length > 0
      ? { images: message.images.map((image) => image.data) }
      : {}),
  }));
}

/**
 * Extrae el primer valor JSON completo de un texto, aunque venga con
 * razonamiento, bloques markdown o texto adicional alrededor.
 */
function parseStructuredJson(text) {
  if (typeof text !== "string") {
    return undefined;
  }

  const cleaned = text
    .replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!cleaned) {
    return undefined;
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Se intenta localizar un objeto o array equilibrado dentro del texto.
  }

  for (let start = 0; start < cleaned.length; start += 1) {
    const char = cleaned[start];
    if (char !== "{" && char !== "[") {
      continue;
    }

    const end = findJsonEnd(cleaned, start);
    if (end === -1) {
      continue;
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // Se prueba con el siguiente posible inicio.
    }
  }

  return undefined;
}

function findJsonEnd(text, start) {
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      stack.push(char);
      continue;
    }

    if (char === "}" || char === "]") {
      const opening = stack.pop();
      const matches =
        (char === "}" && opening === "{") || (char === "]" && opening === "[");
      if (!matches) {
        return -1;
      }
      if (stack.length === 0) {
        return index;
      }
    }
  }

  return -1;
}

// ---------------------------------------------------------------------------
// Cliente de Ollama
// ---------------------------------------------------------------------------

async function postJson(url, body, label) {
  logDeep(`${label} request:`, { url, body });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(OLLAMA_API_KEY ? { authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });

  const raw = await response.text();

  if (!response.ok) {
    let detail = raw;
    try {
      detail = JSON.parse(raw)?.error ?? raw;
    } catch {
      // Se usa el texto plano.
    }
    throw new OllamaHttpError(
      `${label} failed (${response.status}): ${detail}`,
      response.status,
      raw,
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} returned invalid JSON: ${raw.slice(0, 500)}`);
  }
}

function normalizeUsage(inputTokens, outputTokens) {
  if (!Number.isInteger(inputTokens) || !Number.isInteger(outputTokens)) {
    return undefined;
  }
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

function truncate(text, maxLength) {
  if (typeof text !== "string" || text.length <= maxLength) {
    return text ?? "";
  }
  return `${text.slice(0, maxLength)}\n...(truncado)`;
}

async function requestNativeOllama(params) {
  const body = {
    model: OLLAMA_MODEL,
    messages: toNativeMessages(params.messages),
    stream: false,
    options: {
      temperature: params.temperature,
      num_ctx: OLLAMA_NUM_CTX,
      num_predict: params.maxTokens,
      ...(params.stop?.length ? { stop: params.stop } : {}),
    },
  };

  if (!THINKING_ENABLED && params.sendThink !== false) {
    body.think = false;
  }
  if (params.schema) {
    body.format = params.schema;
  }

  const data = await postJson(`${OLLAMA_BASE_URL}/api/chat`, body, "[OLLAMA][NATIVE]");

  return {
    content: typeof data.message?.content === "string" ? data.message.content : "",
    thinking: typeof data.message?.thinking === "string" ? data.message.thinking : "",
    finishReason: data.done_reason ?? (data.done ? "stop" : undefined),
    usage: normalizeUsage(data.prompt_eval_count, data.eval_count),
  };
}

async function requestOpenAIOllama(params) {
  const body = {
    model: OLLAMA_MODEL,
    messages: toOpenAIMessages(params.messages),
    stream: false,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    ...(params.stop?.length ? { stop: params.stop } : {}),
  };

  if (!THINKING_ENABLED && params.sendReasoningEffort !== false) {
    // Ollama interpreta "none" como desactivar el modo pensamiento de Qwen.
    body.reasoning_effort = "none";
  }
  if (params.schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: params.schemaName ?? "response",
        schema: params.schema,
      },
    };
  }

  const data = await postJson(
    `${OLLAMA_OPENAI_URL}/chat/completions`,
    body,
    "[OLLAMA][OPENAI]",
  );

  const choice = data.choices?.[0];
  const message = choice?.message ?? {};
  const content =
    typeof message.content === "string"
      ? message.content
      : contentToText(message.content);

  return {
    content,
    thinking:
      typeof message.reasoning === "string"
        ? message.reasoning
        : typeof message.reasoning_content === "string"
          ? message.reasoning_content
          : "",
    finishReason: choice?.finish_reason,
    usage: normalizeUsage(data.usage?.prompt_tokens, data.usage?.completion_tokens),
  };
}

async function requestOllama(params) {
  if (OLLAMA_API === "openai") {
    return requestOpenAIOllama(params);
  }

  try {
    return await requestNativeOllama(params);
  } catch (error) {
    const canFallback =
      OLLAMA_API === "auto" &&
      error instanceof OllamaHttpError &&
      [401, 403, 404, 405].includes(error.status);

    if (!canFallback) {
      throw error;
    }

    logStep("La API nativa de Ollama no está disponible; usando /v1/chat/completions");
    return requestOpenAIOllama(params);
  }
}

async function chatWithOllama(params) {
  try {
    return await requestOllama(params);
  } catch (error) {
    if (error instanceof OllamaHttpError && error.status === 400) {
      if (params.sendThink !== false && /think/i.test(error.message)) {
        logStep("El modelo no admite la opción 'think'; reintentando sin ella");
        return chatWithOllama({ ...params, sendThink: false });
      }

      if (
        params.sendReasoningEffort !== false &&
        /reasoning[_\s-]?effort/i.test(error.message)
      ) {
        logStep("El servidor no admite 'reasoning_effort'; reintentando sin él");
        return chatWithOllama({ ...params, sendReasoningEffort: false });
      }

      // Ollama antiguo puede no soportar response_format con JSON Schema.
      if (params.schema) {
        logStep("El servidor rechazó el esquema JSON; reintentando sin response_format");

        const schemaText = `JSON schema:\n${JSON.stringify(params.schema)}`;
        const messages = params.messages.map((message) => ({ ...message }));
        const systemMessage = messages.find((message) => message.role === "system");
        if (systemMessage) {
          systemMessage.text = `${systemMessage.text}\n\n${schemaText}`;
        } else {
          messages.unshift({ role: "system", text: schemaText, images: [] });
        }

        return requestOllama({ ...params, messages, schema: undefined });
      }
    }

    throw error;
  }
}

async function ollamaGenerate(params) {
  const structured = params.responseFormat?.type === "json_schema";
  const schema = structured ? params.responseFormat.schema : undefined;
  const schemaName = structured ? params.responseFormat.name : undefined;
  const messages = toInternalMessages(params);

  if (messages.length === 0) {
    throw new Error("Ollama request has no messages");
  }

  logInfo(
    `Ollama -> modelo=${OLLAMA_MODEL} formato=${structured ? "json_schema" : "text"}` +
      `${schemaName ? ` esquema=${schemaName}` : ""} mensajes=${messages.length}`,
  );

  const temperature = structured ? 0 : (params.temperature ?? 0.2);
  const baseMaxTokens = structured
    ? OLLAMA_MAX_TOKENS
    : Math.min(OLLAMA_MAX_TOKENS, 1024);
  const budgets = structured
    ? [baseMaxTokens, baseMaxTokens * 2, baseMaxTokens * 4]
    : [baseMaxTokens, baseMaxTokens * 2];
  let response;
  let structuredContent;
  let hasCompleteStructuredContent = false;

  for (const maxTokens of budgets) {
    response = await chatWithOllama({
      messages,
      schema,
      schemaName,
      temperature,
      stop: params.stopSequences,
      maxTokens,
    });

    if (structured) {
      const parsed = parseStructuredJson(response.content);
      const truncated = response.finishReason === "length";

      if (parsed !== undefined && !truncated) {
        structuredContent = parsed;
        hasCompleteStructuredContent = true;
        break;
      }

      if (parsed !== undefined) {
        structuredContent = parsed;
      }

      logStep(
        truncated
          ? "La respuesta se ha truncado; reintentando con más tokens"
          : "La respuesta no contiene JSON; reintentando",
      );
    } else if (response.content.trim()) {
      break;
    } else {
      logStep("Respuesta vacía; reintentando con más tokens");
    }
  }

  if (structured && !hasCompleteStructuredContent) {
    logStep("Reparando la respuesta JSON con una segunda petición");
    const lastUserText =
      [...messages].reverse().find((message) => message.role === "user")?.text ?? "";
    const repaired = await chatWithOllama({
      messages: [
        {
          role: "system",
          text: `${JSON_ONLY_INSTRUCTION}\nJSON schema:\n${JSON.stringify(schema)}`,
          images: [],
        },
        {
          role: "user",
          text:
            `Generate only a JSON value that conforms to the schema.\n` +
            `Original task:\n${truncate(lastUserText, 6000)}\n` +
            `Invalid previous output:\n${truncate(response?.content, 2000) || "(empty)"}`,
          images: [],
        },
      ],
      schema,
      schemaName,
      temperature: 0,
      stop: params.stopSequences,
      maxTokens: Math.min(baseMaxTokens * 4, 8192),
    });
    response = repaired;
    structuredContent = parseStructuredJson(repaired.content);
  }

  if (structured && structuredContent === undefined) {
    throw new Error(
      `Ollama did not return valid JSON (finish_reason=${response?.finishReason ?? "unknown"}): ` +
        `${response?.content?.slice(0, 1000) || "(empty)"}`,
    );
  }

  const text = structured
    ? JSON.stringify(structuredContent)
    : (response?.content ?? "").trim();

  logInfo(
    `Ollama <- finish=${response?.finishReason ?? "unknown"} ` +
      `tokens=${response?.usage ? `${response.usage.inputTokens}/${response.usage.outputTokens}` : "?"} ` +
      `${structured ? "json=ok" : `texto=${text.length} caracteres`}`,
  );
  logDeep("[OLLAMA][CONTENT]", text);
  logDeep("[OLLAMA][THINKING]", response?.thinking);

  if (structured) {
    return {
      outputFormat: "json_schema",
      role: "assistant",
      content: { type: "text", text },
      structuredContent,
      usage: response?.usage,
    };
  }

  return {
    outputFormat: "text",
    role: "assistant",
    content: { type: "text", text },
    usage: response?.usage,
  };
}

// ---------------------------------------------------------------------------
// Utilidades de Moodle
// ---------------------------------------------------------------------------

function getMoodleRoot(courseUrl) {
  const url = new URL(courseUrl);
  const markers = ["/course/", "/mod/", "/login/", "/enrol/", "/user/"];
  let cut = -1;

  for (const marker of markers) {
    const index = url.pathname.indexOf(marker);
    if (index >= 0 && (cut === -1 || index < cut)) {
      cut = index;
    }
  }

  const basePath =
    cut >= 0 ? url.pathname.slice(0, cut) : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${basePath === "/" ? "" : basePath}`;
}

async function isVisible(page, selector) {
  try {
    return await page.locator(selector).first().isVisible();
  } catch {
    return false;
  }
}

async function hasAny(page, selector) {
  try {
    return (await page.locator(selector).count()) > 0;
  } catch {
    return false;
  }
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    if (await isVisible(page, selector)) {
      await page.locator(selector).first().fill(value);
      return true;
    }
  }
  return false;
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    if (await isVisible(page, selector)) {
      await page.locator(selector).first().click();
      return true;
    }
  }
  return false;
}

async function looksLoggedIn(page) {
  const hasLoginForm = await isVisible(page, 'input[name="username"]');
  const hasLogout = await hasAny(page, 'a[href*="logout"]');
  return !hasLoginForm || hasLogout;
}

async function loginToMoodle(page, courseUrl, username, password) {
  if (await looksLoggedIn(page)) {
    logStep("Ya hay una sesión de Moodle iniciada");
    return;
  }

  const loginUrl = `${getMoodleRoot(courseUrl)}/login/index.php`;

  if (!(await isVisible(page, 'input[name="username"]'))) {
    logStep(`Abriendo formulario de acceso: ${loginUrl}`);
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load").catch(() => {});
  }

  if (!(await isVisible(page, 'input[name="username"]'))) {
    const clicked = await clickFirst(page, [
      'a[href*="/login/index.php"]',
      'a[href*="login"]',
    ]);
    if (clicked) {
      await page.waitForLoadState("load").catch(() => {});
    }
  }

  const userFilled = await fillFirst(
    page,
    ['#username', 'input[name="username"]', 'input[autocomplete="username"]'],
    username,
  );
  const passwordFilled = await fillFirst(
    page,
    ['#password', 'input[name="password"]', 'input[type="password"]'],
    password,
  );

  if (!userFilled || !passwordFilled) {
    throw new Error("No se ha encontrado el formulario de acceso de Moodle.");
  }

  const submitted = await clickFirst(page, [
    "#loginbtn",
    'form:has(#username) button[type="submit"]',
    'form:has(input[name="username"]) button[type="submit"]',
    'form button[type="submit"]',
    'form input[type="submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
  ]);

  if (!submitted) {
    throw new Error("No se ha encontrado el botón de acceso de Moodle.");
  }

  await page.waitForTimeout(1000);
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(1500);

  if (await isVisible(page, 'input[name="username"]')) {
    throw new Error(
      "No se ha podido iniciar sesión en Moodle (usuario/contraseña incorrectos).",
    );
  }

  logStep("Sesión de Moodle iniciada");
}

async function handleEnrollmentKey(page, courseUrl, enrollmentKey) {
  await page.goto(courseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => {});

  const keySelectors = [
    'input[name="enrolpassword"]',
    "#id_enrolpassword",
    'input[name="password"]',
  ];
  const hasKeyField = (
    await Promise.all(keySelectors.map((selector) => isVisible(page, selector)))
  ).some(Boolean);

  if (!hasKeyField) {
    logStep("Moodle no pide clave de matriculación");
    return;
  }

  if (!enrollmentKey) {
    logStep("Moodle pide clave de matriculación, pero no se ha indicado ninguna");
    return;
  }

  logStep("Rellenando la clave de matriculación");
  const filled = await fillFirst(page, keySelectors, enrollmentKey);
  if (!filled) {
    logStep("No se ha podido rellenar la clave de matriculación");
    return;
  }

  const submitted = await clickFirst(page, [
    "#id_submitbutton",
    'form:has(input[name="enrolpassword"]) button[type="submit"]',
    'form:has(input[name="enrolpassword"]) input[type="submit"]',
    'form:has(#id_enrolpassword) button[type="submit"]',
    'form:has(#id_enrolpassword) input[type="submit"]',
    'form button[type="submit"]',
    'form input[type="submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
  ]);

  if (submitted) {
    await page.waitForTimeout(1000);
    await page.waitForLoadState("load").catch(() => {});
    await page.waitForTimeout(1500);
  }

  await page.goto(courseUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
}

async function uploadAssignmentFile(page, assignmentFile, state) {
  if (!assignmentFile || state.uploaded) {
    return;
  }

  const fileInput = page.locator('input[type="file"]').first();

  if ((await fileInput.count().catch(() => 0)) === 0) {
    return;
  }

  try {
    await fileInput.setInputFiles(assignmentFile);
    state.uploaded = true;
    logStep(`Archivo subido a la tarea: ${assignmentFile}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep(`No se ha podido subir el archivo: ${message}`);
  }
}

async function performTask(stagehand, page, taskInstruction, assignmentFile) {
  let consecutiveFailures = 0;
  const uploadState = { uploaded: false };

  for (let step = 1; step <= MAX_ACT_STEPS; step += 1) {
    logStep(`Ejecutando la tarea (paso ${step}/${MAX_ACT_STEPS})`);

    await uploadAssignmentFile(page, assignmentFile, uploadState);

    try {
      const result = await stagehand.act(
        `You are inside a Moodle course page. Goal: ${taskInstruction}. ` +
          "Choose only the single next action (click, type, select...) that moves the page " +
          "towards the goal. If the goal is already fully completed, do nothing and return no action.",
      );
      logDeep("Resultado de la acción:", result.data);

      if (result.data.success === false) {
        if (/no action found/i.test(result.data.message)) {
          logStep("El modelo no encuentra más acciones: la tarea parece terminada");
          return;
        }

        consecutiveFailures += 1;
        logStep(
          `La acción no se ha podido completar (${consecutiveFailures}/2): ${result.data.message}`,
        );

        if (consecutiveFailures >= 2) {
          throw new Error(result.data.message);
        }

        await page.waitForTimeout(1000);
        continue;
      }

      consecutiveFailures = 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (/no action found|no actionable element/i.test(message)) {
        logStep("El modelo no encuentra más acciones: la tarea parece terminada");
        return;
      }

      consecutiveFailures += 1;
      logStep(`La acción ha fallado (${consecutiveFailures}/2): ${message}`);

      if (consecutiveFailures >= 2) {
        throw error;
      }

      await page.waitForTimeout(1000);
      continue;
    }

    await uploadAssignmentFile(page, assignmentFile, uploadState);

    await page.waitForTimeout(1500);
    await page.waitForLoadState("domcontentloaded").catch(() => {});
  }

  logStep(`Se ha alcanzado el límite de ${MAX_ACT_STEPS} pasos para la tarea`);
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------

async function main() {
  logStep("Solicitando datos al usuario");
  const rl = createInterface({ input, output });

  const courseUrl = (await rl.question("URL del curso de Moodle: ")).trim();
  const taskInstruction = (await rl.question("Tarea a realizar en el curso: ")).trim();
  const moodleUsername = (await rl.question("Usuario de Moodle: ")).trim();
  const moodlePassword = await rl.question("Contraseña de Moodle: ");
  const enrollmentKey = await rl.question(
    "Clave de matriculación del curso (si aplica, opcional): ",
  );
  const assignmentFileAnswer = (
    await rl.question("Archivo para subir en la tarea (ruta, opcional): ")
  ).trim();
  await rl.close();

  const assignmentFile = assignmentFileAnswer
    ? resolve(assignmentFileAnswer.replace(/^["']|["']$/g, ""))
    : undefined;

  registerSecret(moodlePassword);
  registerSecret(enrollmentKey);

  if (!courseUrl) {
    throw new Error("La URL del curso es obligatoria.");
  }

  if (!taskInstruction) {
    throw new Error("La tarea a realizar es obligatoria.");
  }

  if (!moodleUsername || !moodlePassword) {
    throw new Error("Usuario y contraseña de Moodle son obligatorios.");
  }

  if (assignmentFile) {
    if (!existsSync(assignmentFile)) {
      throw new Error(`El archivo indicado no existe: ${assignmentFile}`);
    }

    if (!statSync(assignmentFile).isFile()) {
      throw new Error(`La ruta indicada no es un archivo: ${assignmentFile}`);
    }
  }

  logStep("Iniciando navegador");
  const browser = await localBrowser.launch({
    headless: process.env.HEADLESS === "1",
  });

  try {
    logStep("Creando sesión de Stagehand");
    const stagehand = await Stagehand.create({
      browser,
      model: { generate: ollamaGenerate },
    });

    try {
      const pages = await browser.context.pages();
      const page = pages[0] ?? (await browser.context.newPage());

      logStep("Abriendo curso en Moodle");
      await page.goto(courseUrl, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load").catch(() => {});

      await loginToMoodle(page, courseUrl, moodleUsername, moodlePassword);
      await handleEnrollmentKey(page, courseUrl, enrollmentKey);

      logStep("Extrayendo estado inicial del curso");
      try {
        const extractResult = await stagehand.extract(
          "Extract the current course title and a short page status summary.",
          z.object({
            courseTitle: z.string(),
            statusSummary: z.string(),
          }),
        );
        logDeep("Resultado de la extracción:", extractResult.data);
      } catch (error) {
        logStep(`No se ha podido extraer el estado inicial: ${error.message}`);
      }

      logStep("Ejecutando la tarea solicitada por el usuario");
      await performTask(stagehand, page, taskInstruction, assignmentFile);

      logStep("Resumiendo el estado final del curso");
      try {
        const finalState = await stagehand.extract(
          "Extract the current course title and whether the requested task appears completed.",
          z.object({
            courseTitle: z.string(),
            taskCompleted: z.boolean(),
            summary: z.string(),
          }),
        );
        logDeep("Estado final:", finalState.data);
      } catch (error) {
        logStep(`No se ha podido resumir el estado final: ${error.message}`);
      }
    } finally {
      await stagehand.close();
    }
  } finally {
    await browser.close();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export {
  ollamaGenerate,
  parseStructuredJson,
  getMoodleRoot,
  loginToMoodle,
  handleEnrollmentKey,
  uploadAssignmentFile,
  performTask,
};
