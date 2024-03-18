import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { onRequest } from 'firebase-functions/v2/https';
import { createContext } from './context.js';
import { appRouter } from './router.js';

export const trpc = onRequest(
  {
    region: 'australia-southeast1',
  },
  createHTTPHandler({ router: appRouter, createContext }),
);
