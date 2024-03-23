import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';

/**
 * Create a context object for a request.
 * @param props
 * @param props.req
 * @param props.res
 * @returns The context object.
 */
export function createContext({ req, res }: CreateHTTPContextOptions) {
  return { req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
