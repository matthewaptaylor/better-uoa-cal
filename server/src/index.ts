import { initializeApp } from 'firebase-admin/app';

export type { AppRouter } from './functions/trpc/router.js';

initializeApp();

export { calendar } from './functions/calendar/index.js';
export { trpc } from './functions/trpc/index.js';
