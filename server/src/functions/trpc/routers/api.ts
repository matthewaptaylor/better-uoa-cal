import { z } from 'zod';
import { createCalendar, getEvents } from '../../../lib/calendar.js';
import {
  generateRandomString,
  getAuthorizationCode,
  getRefreshTokenFromCode,
  getTokensFromRefreshToken,
} from '../../../lib/credentials.js';
import { db } from '../../../lib/db.js';
import { publicProcedure, router } from '../trpc.js';

export const apiRouter = router({
  getRefreshToken: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        token: z.string().min(1),
      }),
    )
    .output(
      z.union([
        z.object({
          refreshToken: z.string(),
        }),
        z.object({
          error: z.string(),
        }),
      ]),
    )
    .mutation(async ({ input }) => {
      // Get PKCE authorization code
      const codeVerifier = generateRandomString();

      const code = await getAuthorizationCode(
        codeVerifier,
        input.username,
        input.password,
        input.token,
      );
      if (code === undefined)
        return {
          error: 'Failed to retreive authorization code.',
        };

      // Exchange authorization code for refresh token
      const refreshToken = await getRefreshTokenFromCode(codeVerifier, code);
      if (refreshToken === undefined)
        return {
          error: 'Failed to get refresh token.',
        };

      return {
        refreshToken,
      };
    }),

  createCalendar: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      }),
    )
    .output(
      z.union([
        z.object({
          id: z.string(),
        }),
        z.object({
          error: z.string(),
        }),
      ]),
    )
    .mutation(async ({ input }) => {
      // Fetch tokens
      const tokens = await getTokensFromRefreshToken(input.refreshToken);
      if (tokens === undefined)
        return {
          error: 'Failed to fetch tokens.',
        };

      // Fetch events
      const events = await getEvents(tokens);
      if (events === undefined)
        return {
          error: 'Failed to fetch events.',
        };

      // Create calendar
      try {
        const calendar = createCalendar(tokens.idToken, events);
        const documentRef = await db.calendars.add({
          data: calendar,
        });

        return {
          id: documentRef.id,
        };
      } catch (e) {
        return {
          error: 'Failed to add calendar to database.',
        };
      }
    }),
});
