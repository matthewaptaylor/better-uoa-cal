import { trpc } from '@/lib/api';
import { FC } from 'react';

export const CreateCalendar: FC = () => {
  const mutation = trpc.api.createCalendar.useMutation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const data = new FormData(e.target as HTMLFormElement);
        mutation.mutate({
          refreshToken: data.get('refreshToken') as string,
        });
      }}
    >
      <h1>2. Create Calendar</h1>

      <p>
        Input your token below, and a calendar link will be generated for you.
        Note: this token will be stored in the database.
      </p>

      <input
        type="text"
        placeholder="Refresh Token"
        name="refreshToken"
        required
      />
      <button type="submit">Create Calendar</button>

      {mutation.isPending ? <p>Loading...</p> : null}

      {mutation.error ? (
        <p>An error occurred. Please try again later.</p>
      ) : null}

      {mutation.data ? (
        'error' in mutation.data ? (
          <p>{mutation.data.error}</p>
        ) : (
          <p>
            Calendar URL: {import.meta.env.VITE_CALENDAR_ENDPOINT}?id=
            {mutation.data.id}
          </p>
        )
      ) : null}
    </form>
  );
};
