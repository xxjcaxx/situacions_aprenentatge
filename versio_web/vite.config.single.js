import { defineConfig } from 'vite';
import { viteSinglefile } from 'vite-plugin-singlefile';
import baseConfig from './vite.config.js'; // Hereda tu config normal

export default defineConfig({
  ...baseConfig,
  plugins: [...(baseConfig.plugins || []), viteSinglefile()],
});