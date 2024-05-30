# Home

## Description

This feature creates announcements posted by the MyMM app.

## Functionality

A user can create and preview announcements that the app will post in a selected channel. The flow is like this:

- The user triggers the "create announcement" action.
- A modal is opened where the user can write the announcement message and select the target channel.
- After submitting, the app will post a preview of the announcement in the private chat with the user.
- The user can preview and check the announcement and - when ready - trigger it to be posted in the target channel.

## Structure

- `events/announcement.ts` contains the event handlers for making an announcement.
- `views/announcement.ts` contains the view code for the announcement modal.
