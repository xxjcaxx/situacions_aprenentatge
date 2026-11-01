import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  HeightRule,
  ImageRun,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import { saveAs } from "file-saver";

const COLORS = {
  accent: "5E65FC",
  heading: "545454",
  accentBg: "CDFFD8",
  border: "808080",
  softBorder: "BFBFBF",
};

console.log("COLORS:", COLORS);

const FONT = "Arial";
const SYMBOL_FONT = "Segoe UI Symbol";

const LABEL_SIZE = 16; 
const VALUE_SIZE = 17; 
const SMALL_SIZE = 15; 
const TITLE_SIZE = 24; 

const PAGE_WIDTH_MM = 210; 
const PAGE_HEIGHT_MM = 297;
const HEADER_SPACE_MM = 22;

const CONTENT_WIDTH = convertMillimetersToTwip(281); // 297 mm - 2 * 8 mm

const MONTHS = [
  "setembre", "octubre", "novembre", "desembre", "gener",
  "febrer", "març", "abril", "maig", "juny",
];

const DESCRIPTORS = [
  "CCL1", "CCL2", "CCL3", "CCL4", "CCL5",
  "CP1", "CP2", "CP3",
  "STEM1", "STEM2", "STEM3", "STEM4", "STEM5",
  "CD1", "CD2", "CD3", "CD4", "CD5",
  "CPSAA1", "CPSAA2", "CPSAA3", "CPSAA4", "CPSAA5",
  "CC1", "CC2", "CC3", "CC4",
  "CE1", "CE2", "CE3",
  "CCEC1", "CCEC2", "CCEC3", "CCEC4",
];

const DUA_GROUPS = [
  {
    title: "Motivació",
    span: 4,
    items: [
      ["mot_perspectiva", "Considera la perspectiva cultural, de gènere i socioeconòmica"],
      ["mot_connexio", "Considera la connexió amb els desafiaments, ODS i afavoreix el rol actiu de l'alumnat"],
      ["mot_implicacio", "Aconsegueix la màxima implicació i participació de tot l'alumnat"],
      ["mot_autoregulacio", "Promou l'autoregulació i l'autoavaluació, negociant amb l'alumnat la finalitat de la SA i compartint els instruments d'avaluació des del inici"],
      ["mot_feedback", "Facilita feedback a temps per què l'alumnat experimente l'èxit, tractant els errors abans de valorar el progrés"],
    ],
  },
  {
    title: "Representació",
    span: 3,
    items: [
      ["rep_acces", "Accesibilitat: física, sensorial i cognitiva"],
      ["rep_formats", "Presenta la informació a l'alumnat utilitzant diferents formats"],
      ["rep_reflexio", "Afavoreix la reflexió i el processament de la informació en diferents nivells"],
      ["rep_models", "Proporciona múltiples models i pautes de tècniques d'autoavaluació"],
    ],
  },
  {
    title: "Acció i expressió",
    span: 3,
    items: [
      ["acc_expressio", "Ofereix a l'alumnat diferents maneres d'expressió del coneixement"],
      ["acc_seguiment", "Hi ha un seguiment continu proporcionant feedback"],
    ],
  },
];



const paragraph = (text, options = {}) =>
  new Paragraph({
    alignment: options.alignment,
    spacing: { before: 0, after: options.after ?? 0 },
    indent: options.indent,
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italics,
        size: options.size ?? VALUE_SIZE,
        color: options.color ?? COLORS.heading,
        font: options.font ?? FONT,
      }),
    ],
  });

const labelParagraphs = (label, { alignment = AlignmentType.LEFT, size = LABEL_SIZE } = {}) => {
  if (!label) return [];
  return String(label)
    .split(/\r?\n/)
    .map((line) => paragraph(line, { bold: true, size, alignment, after: 30 }));
};

const valueParagraphs = (
  value,
  { alignment = AlignmentType.LEFT, size = VALUE_SIZE, minLines = 1 } = {}
) => {
  const lines = String(value ?? "").replace(/\r\n/g, "\n").split("\n");
  while (lines.length < minLines) lines.push("");
  return lines.map((line, index) =>
    paragraph(line, {
      size,
      alignment,
      after: index === lines.length - 1 ? 0 : 20,
    })
  );
};

const titleParagraphs = (text, { size = LABEL_SIZE } = {}) => {
  const lines = String(text ?? "").split(/\r?\n/);
  return lines.map((line) =>
    paragraph(line, { bold: true, size, alignment: AlignmentType.CENTER, after: 0 })
  );
};

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
};

const SOFT_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.softBorder },
};

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

const cell = (children, options = {}) =>
  new TableCell({
    children,
    columnSpan: options.span > 1 ? options.span : undefined,
    rowSpan: options.rowSpan,
    shading: options.fill
      ? { type: ShadingType.CLEAR, fill: options.fill }
      : undefined,
    verticalAlign: options.verticalAlign ?? VerticalAlign.TOP,
    margins: options.margins ?? { top: 60, bottom: 60, left: 80, right: 80 },
    borders: options.borders,
  });

const buildTable = (rows, { columns = 10, width = CONTENT_WIDTH, borders = TABLE_BORDERS } = {}) => {
  const base = Math.floor(width / columns);
  const columnWidths = Array.from({ length: columns }, (_, index) =>
    index === columns - 1 ? width - base * (columns - 1) : base
  );

  return new Table({
    rows,
    width: { size: width, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders,
  });
};

const fieldCell = ({
  label,
  value,
  span = 1,
  rowSpan,
  fill,
  minLines = 1,
  alignment = AlignmentType.LEFT,
  valueAlignment,
  title = false,
  verticalAlign,
}) => {
  const children = title
    ? titleParagraphs(label)
    : labelParagraphs(label, { alignment });

  children.push(
    ...valueParagraphs(value, {
      alignment: valueAlignment ?? alignment,
      minLines,
    })
  );

  return cell(children, {
    span,
    rowSpan,
    fill,
    verticalAlign: verticalAlign ?? (title ? VerticalAlign.CENTER : VerticalAlign.TOP),
  });
};

const sectionTitleCell = (text, { span = 10, rowSpan } = {}) =>
  cell(titleParagraphs(text), {
    span,
    rowSpan,
    fill: COLORS.accentBg,
    verticalAlign: VerticalAlign.CENTER,
  });

const labelCell = (text, { span = 1 } = {}) =>
  cell(labelParagraphs(text, { alignment: AlignmentType.CENTER }), {
    span,
    verticalAlign: VerticalAlign.CENTER,
  });

const monthBoxesTable = (selected) => {
  const boxes = [0, 1, 2, 3, 4].map((index) => {
    const isSelected = Boolean(selected[index]);
    return new TableCell({
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
      shading: isSelected ? { type: ShadingType.CLEAR, fill: COLORS.accentBg } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: SOFT_BORDERS,
    });
  });

  return new Table({
    rows: [
      new TableRow({
        children: boxes,
        height: { value: 320, rule: HeightRule.ATLEAST },
        cantSplit: true,
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: SOFT_BORDERS,
  });
};

const descriptorTable = (isChecked) => {
  const columns = 17;
  const rowsCount = Math.ceil(DESCRIPTORS.length / columns);
  const rows = [];

  for (let rowIndex = 0; rowIndex < rowsCount; rowIndex += 1) {
    const cells = [];

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const descriptor = DESCRIPTORS[rowIndex * columns + columnIndex];

      if (!descriptor) {
        cells.push(
          new TableCell({
            children: [new Paragraph({ children: [] })],
            borders: SOFT_BORDERS,
          })
        );
        continue;
      }

      const checked = isChecked(descriptor);

      cells.push(
        new TableCell({
          children: [
            paragraph(descriptor, {
              bold: true,
              size: 14,
              alignment: AlignmentType.CENTER,
            }),
            paragraph(checked ? "☒" : "☐", {
              size: 16,
              font: SYMBOL_FONT,
              alignment: AlignmentType.CENTER,
              color: checked ? COLORS.accent : COLORS.heading,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 20, bottom: 20, left: 10, right: 10 },
          borders: SOFT_BORDERS,
        })
      );
    }

    rows.push(new TableRow({ children: cells, cantSplit: true }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: SOFT_BORDERS,
  });
};

const duaCell = (group, isChecked) => {
  const children = labelParagraphs(group.title, { alignment: AlignmentType.CENTER });
  children.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [] }));

  group.items.forEach(([name, label]) => {
    const checked = isChecked(name);
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 50 },
        indent: { left: 180, hanging: 180 },
        children: [
          new TextRun({
            text: checked ? "☒" : "☐",
            size: 16,
            font: SYMBOL_FONT,
            color: checked ? COLORS.accent : COLORS.heading,
          }),
          new TextRun({
            text: ` ${label}`,
            size: SMALL_SIZE,
            font: FONT,
            color: COLORS.heading,
          }),
        ],
      })
    );
  });

  return cell(children, { span: group.span });
};

/* ---------- Funcions de construcció de cada pàgina (Restablides) ---------- */

const buildPage1 = ({ values, months }) => {
  const centered = { verticalAlign: VerticalAlign.CENTER };
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        labelCell("CURS ACADÈMIC"),
        fieldCell({ value: values("curs"), span: 2, ...centered }),
        labelCell("ÀREA/MATÈRIA"),
        fieldCell({ value: values("area"), span: 2, ...centered }),
        labelCell("NIVELL I GRUP"),
        fieldCell({ value: values("nivell"), ...centered }),
        labelCell("NÚM. DE SESSIONS"),
        fieldCell({ value: values("n_sessions"), ...centered }),
      ],
    }),
    new TableRow({
      cantSplit: true,
      children: [sectionTitleCell("TEMPORALITZACIÓ")],
    }),
    new TableRow({
      cantSplit: true,
      children: MONTHS.map((month) =>
        cell([paragraph(month, { alignment: AlignmentType.CENTER, size: LABEL_SIZE })], {
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 50, bottom: 50, left: 20, right: 20 },
        })
      ),
    }),
    new TableRow({
      cantSplit: true, 
      children: months.map((selected) =>
        cell([monthBoxesTable(selected)], {
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        })
      ),
    }),
  ];
  return buildTable(rows);
};

const buildPage2 = ({ values }) => {
  const rows = [
    new TableRow({
      children: [
        fieldCell({ label: "SITUACIÓ D'APRENENTATGE NÚM.", value: values("num_situacio"), span: 2, rowSpan: 2 }),
        fieldCell({ label: "TÍTOL", value: values("titol"), span: 4, minLines: 2 }),
        fieldCell({ label: "CONTEXT", value: values("context"), span: 4, minLines: 3 }),
      ],
    }),
    new TableRow({
      children: [
        fieldCell({ label: "DESCRIPCIÓ I JUSTIFICACIÓ", value: values("descripcio"), span: 4, minLines: 4 }),
        fieldCell({ label: "RELACIÓ AMB ELS REPTES DEL S. XXI I AMB ELS ODS", value: values("ods"), span: 4, minLines: 3 }),
      ],
    }),
  ];
  return buildTable(rows);
};

const buildPage3 = ({ values }) => {
  const rows = [
    new TableRow({
      children: [
        sectionTitleCell("COMPETÈNCIES ESPECÍFIQUES I\nCRITERIS D'AVALUACIÓ VINCULATS", { span: 2, rowSpan: 2 }),
        fieldCell({ label: "COMPETÈNCIES ESPECÍFIQUES", value: values("competencies"), span: 4, rowSpan: 2, minLines: 5 }),
        fieldCell({ label: "CRITERIS D'AVALUACIÓ", value: values("criteris"), span: 4, minLines: 4 }),
      ],
    }),
    new TableRow({
      children: [
        fieldCell({ label: "CRITERIS D'AVALUACIÓ VINCULATS", value: values("criteris_vinculats"), span: 4, minLines: 4 }),
      ],
    }),
  ];
  return buildTable(rows);
};

const buildPage4 = ({ values, isChecked }) => {
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        sectionTitleCell("DESCRIPTORS OPERATIUS", { span: 2 }),
        cell([descriptorTable(isChecked)], {
          span: 8,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
        }),
      ],
    }),
    new TableRow({
      children: [
        sectionTitleCell("SABERS BÀSICS", { span: 2 }),
        fieldCell({ value: values("sabers"), span: 8, minLines: 3 }),
      ],
    }),
  ];
  return buildTable(rows);
};

const buildPage5 = ({ values }) => {
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [sectionTitleCell("ORGANITZACIÓ")],
    }),
    new TableRow({
      children: [
        fieldCell({
          label: "SEQÜENCIACIÓ D'ACTIVITATS/DISTRIBUCIÓ DEL TEMPS",
          value: values("sequencia"),
          span: 5,
          minLines: 7,
          alignment: AlignmentType.CENTER,
          valueAlignment: AlignmentType.LEFT,
        }),
        fieldCell({
          label: "AVALUACIÓ",
          value: values("avaluacio"),
          span: 5,
          minLines: 7,
          alignment: AlignmentType.CENTER,
          valueAlignment: AlignmentType.LEFT,
          //fill: COLORS.accentBg,
        }),
      ],
    }),
  ];
  return buildTable(rows);
};

const buildPage6 = ({ values }) => {
  const rows = [
    new TableRow({
      children: [
        fieldCell({
          label: "MESURES DE RESPOSTA PER A LA INCLUSIÓ: NIVELL II",
          value: values("mesuresII"),
          span: 4,
          minLines: 5,
          alignment: AlignmentType.CENTER,
          valueAlignment: AlignmentType.LEFT,
          //fill: COLORS.accentBg,
        }),
        fieldCell({
          label: "MESURES DE RESPOSTA PER A LA INCLUSIÓ: NIVELL III",
          value: values("mesuresIII"),
          span: 3,
          minLines: 5,
          alignment: AlignmentType.CENTER,
          valueAlignment: AlignmentType.LEFT,
          //fill: COLORS.accentBg,
        }),
        fieldCell({
          label: "MESURES DE RESPOSTA PER A LA INCLUSIÓ: NIVELL IV",
          value: values("mesuresIV"),
          span: 3,
          minLines: 5,
          alignment: AlignmentType.CENTER,
          valueAlignment: AlignmentType.LEFT,
         // fill: COLORS.accentBg,
        }),
      ],
    }),
  ];
  return buildTable(rows);
};

const buildPage7 = ({ isChecked }) => {
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        sectionTitleCell(
          "Aprenentatge accessible (hi ha que marcar els elements utilitzats que faciliten l'accessibilitat de l'aprenentatge DUA)"
        ),
      ],
    }),
    new TableRow({
      children: DUA_GROUPS.map((group) => duaCell(group, isChecked)),
    }),
  ];
  return buildTable(rows);
};

/* ---------- Capçalera i document ---------- */

const loadImage = async (src) => {
  if (!src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (error) {
    console.warn("No s'ha pogut carregar la imatge:", error);
    return null;
  }
};

const imageParagraph = (data, { width, height, alignment }) =>
  new Paragraph({
    alignment,
    spacing: { before: 0, after: 0 },
    children: data
      ? [new ImageRun({ type: "png", data, transformation: { width, height } })]
      : [],
  });

const buildHeader = ({ logo, generalitat }) => {
  const base = Math.floor(CONTENT_WIDTH / 10);

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [imageParagraph(logo, { width: 100, height: 54, alignment: AlignmentType.LEFT })],
            verticalAlign: VerticalAlign.CENTER,
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
          new TableCell({
            children: [paragraph("CEIP Vicente Rius Guillemes", { bold: true, size: 30, alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 40, right: 40 },
          }),
          new TableCell({
            children: [imageParagraph(generalitat, { width: 64, height: 31, alignment: AlignmentType.RIGHT })],
            verticalAlign: VerticalAlign.CENTER,
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
        ],
      }),
    ],
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [base * 3, base * 4, base * 3],
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
  });
};

const pageBreak = () =>
  new Paragraph({
    pageBreakBefore: true,
    spacing: { before: 0, after: 120 },
    children: [],
  });



const readFormData = () => {
  const form = document.querySelector("#sa-form");
  const values = (name) => {
    const element = form.querySelector(`[name="${name}"]`);
    return element ? element.value : "";
  };
  const isChecked = (name) => {
    const elements = form.querySelectorAll(`input[type="checkbox"][name="${name}"]`);
    return Array.from(elements).some((element) => element.checked);
  };
  const monthRows = Array.from(document.querySelectorAll("#sa-form .month-row"));
  const months = MONTHS.map((_, index) => {
    const row = monthRows[index];
    if (!row) return [false, false, false, false, false];
    return Array.from(row.querySelectorAll(".month-box")).map(
      (box) => box.getAttribute("aria-pressed") === "true"
    );
  });
  return { values, isChecked, months };
};

const safeFileName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

const buildDocument = async () => {
  const { values, isChecked, months } = readFormData();
  const headerImages = Array.from(document.querySelectorAll("#header img"));
  const [logo, generalitat] = await Promise.all([
    loadImage(headerImages[0]?.src),
    loadImage(headerImages[1]?.src),
  ]);

  const context = { values, isChecked, months };

  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [
      new TextRun({
        text: "PROGRAMACIÓ D'AULA: SITUACIONS D'APRENENTATGE EDUCACIÓ PRIMÀRIA",
        bold: true,
        size: TITLE_SIZE,
        color: COLORS.accent,
        font: FONT,
      }),
    ],
  });

  const pageTables = [
    buildPage1(context),
    buildPage2(context),
    buildPage3(context),
    buildPage4(context),
    buildPage5(context),
    buildPage6(context),
    buildPage7(context),
  ];

  const body = [];
pageTables.forEach((table, index) => {
  if (index > 0) body.push(pageBreak());
  body.push(table);
  body.push(new Paragraph({ spacing: { before: 0, after: 240 }, children: [] })); // Crea un espai editable sota cada taula
});
  return new Document({
    creator: "CEIP Vicente Rius Guillemes",
    title: "Programació d'aula: situacions d'aprenentatge",
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(PAGE_WIDTH_MM),
              height: convertMillimetersToTwip(PAGE_HEIGHT_MM),
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertMillimetersToTwip(HEADER_SPACE_MM),
              right: convertMillimetersToTwip(8),
              bottom: convertMillimetersToTwip(8),
              left: convertMillimetersToTwip(8),
            },
          },
        },
        headers: {
          default: new Header({ children: [buildHeader({ logo, generalitat })] }),
        },
        children: [title, ...body],
      },
    ],
  });
};

export const exportFormToDocx = async () => {
  const doc = await buildDocument();
  const blob = await Packer.toBlob(doc);
  const { values } = readFormData();
  const situacio = safeFileName(values("num_situacio"));
  const titol = safeFileName(values("titol"));
  const parts = ["situacio_aprenentatge", situacio, titol].filter(Boolean);
  saveAs(blob, `${parts.join("_") || "situacio_aprenentatge"}.docx`);
};