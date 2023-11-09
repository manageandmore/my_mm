# Common

## Description

The common feature contains common utilities used by other features. These include:

- Converting between userId and scholarId
- Managing feature flags
- Formatting timestamps and durations.

## UserId vs ScholarId

For many features, we need to connect user data between slack and notion. On each end we have separate ids that we need to pair up, in order to correctly assign data from a slack user to the appropriate data of that user in notion, and vice versa.

- For **Slack**, we use the userId as the unique identifier for a user (referred to as `userId`).
- For **Notion**, we use the id of a row in the Scholars database as the unique identifier for a user (referred to as `scholarId`).
  - _We don't work with the actual notion account of a user, because not every user is expected to have joined the notion workspace._
