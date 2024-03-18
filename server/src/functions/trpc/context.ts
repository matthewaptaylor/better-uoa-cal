import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';

export function createContext({ req, res }: CreateHTTPContextOptions) {
  return { req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
