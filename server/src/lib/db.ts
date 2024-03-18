import { schema, Typesaurus } from 'typesaurus';

interface Calendar {
  data: string;
  refreshToken: string;
}

export const db = schema(($) => ({
  calendars: $.collection<Calendar>(),
}));

export type Schema = Typesaurus.Schema<typeof db>;
