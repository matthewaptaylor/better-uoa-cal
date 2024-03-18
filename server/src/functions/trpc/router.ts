import { apiRouter } from './routers/api.js';
import { router } from './trpc.js';

export const appRouter = router({
  api: apiRouter,
});

export type AppRouter = typeof appRouter;
