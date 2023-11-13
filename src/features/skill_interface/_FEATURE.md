# Skill Interface

## Description

This feature provides an interface to get, add or remove skills from the user bases on the notion skill database.

## Functionality

- When the user clicks 'Add Skill' a new modal is shown to create a new skill entry.
- When the user clicks 'Delete' the skill is removed from the notion database.
- When the user clicks 'Submit Changes' the added/removed skills are synchronized with the notion database.

## Structure

- `events/` contains all event handlers for the actions and modal submissions.
  - `add_skill.ts` contains the action handler and modal submission handler for the `Add Skill` modal.
  - `edit_skills.ts` contains the action handler for editing the skill list.
  - `remove_skill.ts` contains the action handler for removing a skill list entry.
- `data/` contains logic for querying and updating data in notion.
  - `edit_skills.ts` contains the logic for adding/removing a skill entry to/from notion.
  - `query_skills.ts` contains the logic for retrieving the skill data and formatting it in the needed format.
  - `skill_stack.ts` contains the interfaces that can be used to transfer the current skill List between the different functions.
- `modals/` contains layout code for the used modals.
  - `new_skill_modal.ts` contains the modal code for adding a new skill entry.
  - `edit_skill.ts` contains the skill list modal code.
  - `skill_status.ts` contains the modal code for the skill status modal.
