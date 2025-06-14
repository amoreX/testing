#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Environment variables validation
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_REFRESH_TOKEN",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Create MCP server
const server = new McpServer({
  name: "google-calendar-server",
  version: "1.0.0",
  description: "MCP server for Google Calendar integration",
});

// Tool: List calendar events
server.tool(
  "list_events",
  {
    timeMin: z
      .string()
      .optional()
      .describe("Start time (ISO 8601 format). Defaults to now."),
    timeMax: z
      .string()
      .optional()
      .describe("End time (ISO 8601 format). Defaults to 7 days from now."),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of events to return (1-2500)"),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID to query"),
  },
  async ({ timeMin, timeMax, maxResults, calendarId }) => {
    try {
      const now = new Date();
      const defaultTimeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin || now.toISOString(),
        timeMax: timeMax || defaultTimeMax.toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];

      if (events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No events found in the specified time range.",
            },
          ],
        };
      }

      const formattedEvents = events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          status: a.responseStatus,
        })),
        htmlLink: event.htmlLink,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedEvents, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing events: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Tool: Create calendar event
server.tool(
  "create_event",
  {
    summary: z.string().describe("Event title/summary"),
    description: z.string().optional().describe("Event description"),
    startDateTime: z.string().describe("Start date and time (ISO 8601 format)"),
    endDateTime: z.string().describe("End date and time (ISO 8601 format)"),
    location: z.string().optional().describe("Event location"),
    attendeeEmails: z
      .array(z.string().email())
      .optional()
      .describe("List of attendee email addresses"),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID to create event in"),
    timeZone: z
      .string()
      .optional()
      .default("UTC")
      .describe("Time zone for the event"),
  },
  async ({
    summary,
    description,
    startDateTime,
    endDateTime,
    location,
    attendeeEmails,
    calendarId,
    timeZone,
  }) => {
    try {
      const event = {
        summary,
        description,
        location,
        start: {
          dateTime: startDateTime,
          timeZone: timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: timeZone,
        },
        attendees: attendeeEmails?.map((email) => ({ email })),
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event created successfully:\n${JSON.stringify(
              {
                id: response.data.id,
                summary: response.data.summary,
                start: response.data.start,
                end: response.data.end,
                htmlLink: response.data.htmlLink,
              },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating event: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Tool: Update calendar event
server.tool(
  "update_event",
  {
    eventId: z.string().describe("Event ID to update"),
    summary: z.string().optional().describe("New event title/summary"),
    description: z.string().optional().describe("New event description"),
    startDateTime: z
      .string()
      .optional()
      .describe("New start date and time (ISO 8601 format)"),
    endDateTime: z
      .string()
      .optional()
      .describe("New end date and time (ISO 8601 format)"),
    location: z.string().optional().describe("New event location"),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID containing the event"),
    timeZone: z
      .string()
      .optional()
      .default("UTC")
      .describe("Time zone for the event"),
  },
  async ({
    eventId,
    summary,
    description,
    startDateTime,
    endDateTime,
    location,
    calendarId,
    timeZone,
  }) => {
    try {
      // First, get the existing event
      const existingEvent = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      const updateData = {
        summary: summary || existingEvent.data.summary,
        description:
          description !== undefined
            ? description
            : existingEvent.data.description,
        location:
          location !== undefined ? location : existingEvent.data.location,
        start: startDateTime
          ? { dateTime: startDateTime, timeZone }
          : existingEvent.data.start,
        end: endDateTime
          ? { dateTime: endDateTime, timeZone }
          : existingEvent.data.end,
      };

      const response = await calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updateData,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event updated successfully:\n${JSON.stringify(
              {
                id: response.data.id,
                summary: response.data.summary,
                start: response.data.start,
                end: response.data.end,
                htmlLink: response.data.htmlLink,
              },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating event: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Tool: Delete calendar event
server.tool(
  "delete_event",
  {
    eventId: z.string().describe("Event ID to delete"),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID containing the event"),
  },
  async ({ eventId, calendarId }) => {
    try {
      // First get event details for confirmation
      const existingEvent = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      await calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event "${existingEvent.data.summary}" (ID: ${eventId}) deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting event: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Tool: Find free time slots
server.tool(
  "find_free_time",
  {
    duration: z.number().describe("Duration in minutes for the free slot"),
    timeMin: z
      .string()
      .optional()
      .describe(
        "Start time to search from (ISO 8601 format). Defaults to now."
      ),
    timeMax: z
      .string()
      .optional()
      .describe(
        "End time to search until (ISO 8601 format). Defaults to end of day."
      ),
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID to check"),
    workingHoursStart: z
      .number()
      .optional()
      .default(9)
      .describe("Working hours start (24-hour format)"),
    workingHoursEnd: z
      .number()
      .optional()
      .default(17)
      .describe("Working hours end (24-hour format)"),
  },
  async ({
    duration,
    timeMin,
    timeMax,
    calendarId,
    workingHoursStart,
    workingHoursEnd,
  }) => {
    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const searchStart = timeMin ? new Date(timeMin) : now;
      const searchEnd = timeMax ? new Date(timeMax) : endOfDay;

      // Get busy times
      const response = await calendar.freebusy.query({
        resource: {
          timeMin: searchStart.toISOString(),
          timeMax: searchEnd.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const busyTimes = response.data.calendars?.[calendarId]?.busy || [];
      const freeSlots = [];

      let currentTime = new Date(searchStart);

      // Ensure we start within working hours
      if (currentTime.getHours() < workingHoursStart) {
        currentTime.setHours(workingHoursStart, 0, 0, 0);
      }

      while (currentTime < searchEnd) {
        // Skip if outside working hours
        if (
          currentTime.getHours() < workingHoursStart ||
          currentTime.getHours() >= workingHoursEnd
        ) {
          currentTime.setTime(currentTime.getTime() + 60 * 60 * 1000); // Skip 1 hour
          continue;
        }

        const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);

        // Check if this slot conflicts with any busy time
        const hasConflict = busyTimes.some((busy) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);

          return currentTime < busyEnd && slotEnd > busyStart;
        });

        if (!hasConflict && slotEnd.getHours() <= workingHoursEnd) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
            duration: duration,
          });

          // If we found enough slots, break
          if (freeSlots.length >= 10) break;
        }

        // Move to next 15-minute interval
        currentTime.setTime(currentTime.getTime() + 15 * 60 * 1000);
      }

      return {
        content: [
          {
            type: "text",
            text:
              freeSlots.length > 0
                ? `Found ${freeSlots.length} free slots:\n${JSON.stringify(
                    freeSlots,
                    null,
                    2
                  )}`
                : `No free slots of ${duration} minutes found in the specified time range.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding free time: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Resource: Calendar list
server.resource("calendars", "calendars://list", async (uri) => {
  try {
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    const formattedCalendars = calendars.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      location: cal.location,
      timeZone: cal.timeZone,
      accessRole: cal.accessRole,
      primary: cal.primary,
    }));

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(formattedCalendars, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: `Error fetching calendars: ${error.message}`,
        },
      ],
    };
  }
});

// Resource: Today's events
server.resource("events", "events://today", async (uri) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    const formattedEvents = events.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
    }));

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(formattedEvents, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: `Error fetching today's events: ${error.message}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Calendar MCP Server running on stdio");
}

main().catch(console.error);
