import { loadEnv } from 'vite';
import { createOffersMiddleware } from './favoritMiddleware.js';

function attachMiddleware(server) {
  server.middlewares.use((request, response, next) => {
    const pathname = (request.url || '').split('?')[0];
    if (pathname !== '/api/offers') {
      next();
      return;
    }

    let env;
    try {
      env = {
        ...loadEnv(server.config.mode, server.config.envDir || server.config.root, ''),
        ...process.env,
      };
    } catch {
      env = process.env;
    }
    void createOffersMiddleware({ env })(request, response, next);
  });
}

export function favoritApiPlugin() {
  return {
    name: 'favorit-api',
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  };
}
