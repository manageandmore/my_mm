# Wishlist

## Description

This feature provides a list of wishes and suggestions made by the users regarding future features and improvements to the app. Users can vote on existing items or add new ones. The wishlist is backed by a database in notion.

## Functionality

- The user can open the wishlist by pressing the associated button in the apps home page.
- When a user votes an item, the modal is updated to reflect the changes in votes.
- When the user clicks 'Add Suggestion' a new modal is shown to create a new whishlist item.
- When the user clicks 'View in Notion' he is redirected directly to notion.

## Structure

- `actions/` contains all event handlers for the actions and modal submissions.
  - `actions/new_suggestion.ts` contains the action handler and modal submission handler for the `New Suggestion` modal.
  - `actions/open_wishlist.ts` contains the action hander for opening the wishlist.
  - `actions/vote_suggestion.ts` contains the action handler for voting a wishlist item.

