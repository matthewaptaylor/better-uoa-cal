import { onRequest } from 'firebase-functions/v2/https';
import ical from 'ical-generator';
import { z } from 'zod';
import { db } from '../../lib/db.js';

const calendarQuery = z.object({
  id: z.string(),
});

export const calendar = onRequest(
  {
    region: 'australia-southeast1',
  },
  async (request, response) => {
    const validatedQuery = calendarQuery.safeParse(request.query);
    if (!validatedQuery.success) {
      response.status(400).send();
      return;
    }

    // Get document
    const documentId = db.calendars.id(validatedQuery.data.id);
    const document = await db.calendars.get(documentId)!;
    if (document === null) {
      response.status(404).send();
      return;
    }

    // Parse data
    let calendarData: any;
    try {
      calendarData = JSON.parse(document.data.data);
    } catch {
      response.status(500).send();
      return;
    }

    // Send calendar
    response
      .status(200)
      .type('text/calendar; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="calendar.ics"')
      .send(ical(calendarData).toString());
  },
);
