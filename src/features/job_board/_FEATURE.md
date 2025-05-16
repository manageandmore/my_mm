# Job Board

## Update as of 16.05.2025
The Job Board feature has been disabled indefinitely as we couldn't validate an actual user need

## Description

The Job Board serves as a place for scholars to look for current job offerings available to them. The board can be accessed
through the associated button on the home screen. The overview modal also offers the option to add offers and filter available
offers for company and job type.

## Functionality

- The user can open the job board by pressing the associated button in the apps home page.
- The user can view all available job offers on th job board modal
- The user can filter all available job offers through a filter modal
- The user can add job offers through the job offer creation modal that can be accessed from the job board overview
- The user receives an ephemeral message asking to add a job offer to the job board when posting
  - in the career boost channel
  - using -add job offer flag in messages in channels that have the MyMM app

## Structure

- `events/` contains all event handlers for the actions and modal submissions.
  - `create_job_offer_ephemeral.ts` contains the action handler for posting into careerboost channel and responding with create job offer ephemeral message
  - `new_job.ts` contains the action handler and modal submission handler for the `New Job Offer` modal.
  - `open_job_board.ts` contains the action handler for opening the job board.
- `data/` contains logic for querying and updating data in notion.
  - `add_job.ts` contains the logic for adding a new job board item to notion.
  - `query_jobs.ts` contains the logic for querying the job board.
- `views/` contains layout code for the used modals.
  - `new_job_modal.ts` contains the modal code for adding a new job board item.
  - `job_board_modal.ts` contains the main job board modal code.
  - `open_job_board_button.ts` contains the button displayed on the MyMM homepage
