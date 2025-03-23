# Inbox

## Description

This feature provides the user with a list of messages and notifications that have been sent to them.

## Functionality

- A cron job will check everyday at 11:30 am for overdue reminders and send a message to the user to remind him to answer
- https://calndr.link/api-docs used for creation of google calendar event
- A message can be added to the inbox by adding an "-add to inbox" (case insensitive) to any message in a channel the app is part of or by using message shortcuts via the options button on any message.

## Structure

- `events/` contains all event handlers for the actions and modal submissions.
