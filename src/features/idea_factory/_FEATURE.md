# Idea Factory

## Description

This feature provides a list of ideas made by the users regarding the future of the program. Users can vote on existing ideas or add new ones. The idea factory is backed by a database in Notion.

## Functionality

- The user can open the idea factory by pressing the associated button in the apps home page.
- When a user votes an idea, the modal is updated to reflect the changes in votes.
- When the user clicks 'Add Idea' a new modal is shown to create a new idea item.
- When the user clicks 'View in Notion' they are redirected directly to notion.

## Structure

- `events/` contains all event handlers for the actions and modal submissions.
  - `new_suggestion.ts` contains the action handler and modal submission handler for the `New Idea` modal.
  - `open_idea_factory.ts` contains the action handler for opening the idea factory.
  - `vote_suggestion.ts` contains the action handler for voting an idea.
- `data/` contains logic for querying and updating data in notion.
  - `add_item.ts` contains the logic for adding a new idea to notion.
  - `get_voter.ts` contains the logic for retrieving a voter entity for a scholar/user.
  - `query_items.ts` contains the logic for querying the idea factory.
- `views/` contains layout code for the used modals.
  - `new_idea_modal.ts` contains the modal code for adding a new idea.
  - `open_idea_factory_button.ts` contains the button code for opening the idea factory modal.
  - `idea_factory_modal.ts` contains the main idea factory modal code.
