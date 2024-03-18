import ical, { ICalCalendarMethod, ICalEventData } from 'ical-generator';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import { Tokens } from './credentials.js';

const CALENDAR_URL = `https://apigw.prod.amazon.auckland.ac.nz/website-personalisation-v1/calendar`;

const calendarValidator = z.object({
  current_time: z.string(),
  current_week_start: z.string(),
  next_week_start: z.string(),
  previous_week_start: z.string(),
  'semester/quarter': z.string(),
  week: z.array(
    z.object({
      date: z.string(),
      day: z.string(),
      events: z.array(z.unknown()),
      month: z.string(),
    }),
  ),
});

const eventValidator = z.object({
  campus: z.string(),
  course_code: z.string(),
  course_name: z.string(),
  eventTime: z.number(),
  event_type: z.string(),
  map_url: z.string(),
  room: z.string(),
  source: z.literal('timetable'),
  time_end_display: z.string(),
  time_start_display: z.string(),
  timestamp_end: z.number(),
  timestamp_start: z.number(),
  type: z.string(),
});

/**
 * Get all the Mondays in a given year. This includes the last Monday of the
 * previous year if the year does not start on a Monday.
 * @param year
 * @returns
 */
const getMondaysInYear = (year: number) => {
  const mondays = [];
  const date = new Date(year - 1, 11, 26);
  while (date.getFullYear() <= year) {
    if (date.getDay() === 1) {
      mondays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return mondays;
};

/**
 * Get events from the personalisation API.
 * @param credentials
 * @returns Array of events, or undefined if failed.
 */
export const getEvents = async (credentials: Tokens) => {
  const startDates = getMondaysInYear(new Date().getFullYear());

  const requests = startDates.map((startDate) => {
    // Format as 01-Jan-0000
    const formattedDate = startDate
      .toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-');

    return fetch(`${CALENDAR_URL}?start_date=${formattedDate}`, {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    });
  });

  try {
    const responses = await Promise.all(requests);

    if (responses.some((response) => !response.ok))
      throw new Error('Failed to fetch events.');

    const data = await Promise.all(
      responses.map((response) => response.json()),
    );

    const events: ICalEventData[] = [];
    for (const d of data) {
      const week = calendarValidator.parse(d);
      week.week.forEach((day) => {
        day.events.forEach((event) => {
          const validatedEvent = eventValidator.safeParse(event);
          const data = validatedEvent.success ? validatedEvent.data : undefined;

          if (data !== undefined)
            events.push({
              start: new Date(data.timestamp_start),
              end: new Date(data.timestamp_end),
              summary: `${data.course_code} - ${data.type}`,
              description: data.event_type,
              location: `${data.room} (${data.campus} Campus)`,
            });
        });
      });
    }

    return events;
  } catch (e) {
    return undefined;
  }
};

export const createCalendar = (idToken: string, events: ICalEventData[]) => {
  // Create calendar
  const payload = jwtDecode(idToken);
  const name =
    'name' in payload && typeof payload.name === 'string'
      ? `Timetable - ${payload.name}`
      : 'Timetable';

  const calendar = ical({ name });
  calendar.method(ICalCalendarMethod.REQUEST);

  events.forEach((event) => calendar.createEvent(event));

  return JSON.stringify(calendar.toJSON());
};
