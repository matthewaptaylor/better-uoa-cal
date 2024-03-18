import { trpc, useTrpcClient } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FC, useState } from 'react';
import { CreateCalendar } from './components/CreateCalendar';
import { Login } from './components/Login';

export const App: FC = () => {
  const [queryClient] = useState(() => new QueryClient());
  const trpcClient = useTrpcClient();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Login />
        <CreateCalendar />
      </QueryClientProvider>
    </trpc.Provider>
  );
};
