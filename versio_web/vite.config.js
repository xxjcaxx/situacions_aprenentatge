import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command, mode }) => {
  // Comprobamos si se ha activado la variable de entorno SINGLEFILE
  const isSingleFile = process.env.SINGLEFILE === 'true';

  return {
    base: command === 'build' ? './' : '/',
    plugins: [
      // Añade el plugin solo si ejecutamos el build de archivo único
      isSingleFile ? viteSingleFile() : null,
    ].filter(Boolean), // Elimina los valores nulos
  };
});