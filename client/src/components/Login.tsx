import { trpc } from '@/lib/api';
import { FC } from 'react';

export const Login: FC = () => {
  const mutation = trpc.api.getRefreshToken.useMutation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const data = new FormData(e.target as HTMLFormElement);
        mutation.mutate({
          username: data.get('username') as string,
          password: data.get('password') as string,
          token: data.get('token') as string,
        });
      }}
    >
      <h1>1. Login</h1>

      <p>
        Before creating a calendar link, this tool requires a token compatible
        with University of Auckland APIs that use Cognito for authentication.
      </p>

      <input type="text" placeholder="Username" name="username" required />
      <input type="password" placeholder="Password" name="password" required />
      <input type="text" placeholder="Token" name="token" required />
      <button type="submit">Login</button>

      {mutation.isPending ? <p>Loading...</p> : null}

      {mutation.error ? (
        <p>An error occurred. Please try again later.</p>
      ) : null}

      {mutation.data ? (
        'error' in mutation.data ? (
          <p>{mutation.data.error}</p>
        ) : (
          <p>
            <h2>Generated Token</h2>
            <div>
              Refresh Token:{' '}
              <textarea
                readOnly
                value={mutation.data.refreshToken}
                rows={5}
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.currentTarget.select();
                }}
              />
            </div>
          </p>
        )
      ) : null}
    </form>
  );
};
