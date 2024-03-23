import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { onRequest } from 'firebase-functions/v2/https';
import { httpOptions } from '../../lib/functions.js';
import { createContext } from './context.js';
import { appRouter } from './router.js';

export const trpc = onRequest(
  httpOptions,
  createHTTPHandler({ router: appRouter, createContext }),
);
