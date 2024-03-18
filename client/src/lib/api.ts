import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from 'better-uoa-cal-server';
import { useState } from 'react';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

/**
 * Custom hook to create a tRPC client.
 * @returns
 */
export const useTrpcClient = () => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink<AppRouter>({
          url: import.meta.env.VITE_TRPC_ENDPOINT,
          transformer: superjson,
        }),
      ],
    }),
  );

  return trpcClient;
};
