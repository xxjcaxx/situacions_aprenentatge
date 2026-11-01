import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  return {
    // Si estamos compilando (build), usa './'. Si estamos en desarrollo (serve), usa '/'
    base: command === 'build' ? './' : '/',
    // ... el resto de tu configuración actual ...
  };
});