# Community Credits

## Description

This feature provides the community credits leaderboard and tracks credit messages in slack.

## Functionality

- See the community credit leaderboard on the home page on the app.
- Detects messages containing keywords related to community credits and prompts the user to post them in the #community_credits channel.

## Structure

- `events/detect_messages.ts` detects messages related to community credits.
- `data/query_leaderboard.ts` queries notion for the credits table.
- `views/leaderboard_section.ts/` constructs the view section for the leaderboard.
