# Assistant

## Description

This feature provides an ai assistant for scholars to ask questions about information regarding the program.

## Functionality

- Chat with the assistant either by messaging the app or tagging @MyMM in any message.
- A vector database to store data from notion and slack.
  - For slack, a few selected channels are automatically indexed, where each new message is added to the vector db.
  - For notion, some selected pages and databased are indexed. This is controlled by the "Assistant Index" notion database. Pages are split in chunks, Databases are added by each row.
- The assistant can be called upon to answer any message by tagging @MyMM and adding an "-AI" (case insensitive)

## Structure

- `ai/chain.ts` contains all the model and prompt setup for the AI, using langchain.
- `events/` contains the entry points for the user events.
- `loaders/` contains the various vector db loaders for slack, notion and the website.
