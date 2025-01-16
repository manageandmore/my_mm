import { slack } from "../../../slack";
import { getJobBoardModal } from "../views/job_board_modal";
import { queryJobBoardItems } from "../data/query_jobs";

export const openJobBoardAction = "open_job_board";
export const applyFiltersAction = "apply_filters_action";
export const submitFilterAction = "submit_filter_action";
export const cancelFilterAction = "cancel_filter_action";

/**
 * Opens the job board modal when the user clicks the 'Open Job Board' button.
 *
 * This directly shows the modal with a loading hint to be responsive to the user.
 * It then loads the data and updates the open modal.
 */
slack.action(
  openJobBoardAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    try {
      // Show the modal with the initial loading hint.
      const view = await slack.client.views.open({
        trigger_id: payload.trigger_id,
        view: getJobBoardModal({}),
      });

      console.time("Job Board Query");

      // Fetch all job items and initial job types.
      const items = await queryJobBoardItems({});
      const jobTypes = [...new Set(items.map((item) => item.jobType))]; // Extract unique job types

      console.timeEnd("Job Board Query");

      // Update the modal with the actual data.
      await slack.client.views.update({
        view_id: view.view!.id,
        view: getJobBoardModal({ items, jobTypes }),
      });
    } catch (error) {
      console.error("Error opening job board:", error);
    }
  }
);

/**
 * Handles filtering of the job board when the 'Apply Filters' button is clicked.
 */
slack.action(
  applyFiltersAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    try {
      console.log("Apply Filters button clicked");

      // Fetch all job items to extract filtering options
      const items = await queryJobBoardItems();

      // Dynamically extract unique job types and companies
      const jobTypes = Array.from(new Set(items.map((item) => item.jobType))).filter(Boolean);
      const companies = Array.from(new Set(items.map((item) => item.company))).filter(Boolean);

      console.log("Job types available:", jobTypes);
      console.log("Companies available:", companies);

      // Check that these values are correctly populated
      if (jobTypes.length === 0 || companies.length === 0) {
        throw new Error("Job types or companies list is empty.");
      }

      // Update the modal to show filter input elements with dynamic options
      await slack.client.views.update({
        view_id: payload.view?.id,
        hash: payload.view?.hash,
        view: getJobBoardModal({
          filterMode: true,   // Indicate we're in filter mode
          jobTypes: jobTypes,  // Pass dynamic job types to the modal
          companies: companies, // Pass dynamic companies to the modal
          items: items,       // Pass items (filtered or unfiltered) to populate the modal
        }),
      });

      console.log("Filter modal updated successfully");
    } catch (error) {
      console.error("Error entering filter mode:", error);
    }
  }
);

slack.action(
  submitFilterAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    try {
      // Extract selected filters from the modal state
      const stateValues = payload.view?.state?.values || {};
      const filters = {
        jobType: stateValues?.job_type_filter?.job_type_select?.selected_option?.value || undefined,
        company: stateValues?.company_filter?.company_select?.selected_option?.value || undefined,
        startDate: stateValues?.start_date_filter?.start_date_select?.selected_date
          ? new Date(stateValues.start_date_filter.start_date_select.selected_date)
          : undefined,
      };

      // Fetch filtered job items
      const filteredItems = await queryJobBoardItems(filters);

      // Update the modal with filtered items
      await slack.client.views.update({
        view_id: payload.view?.id,
        hash: payload.view?.hash,
        view: getJobBoardModal({ items: filteredItems }),
      });
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  }
);

slack.action(
  cancelFilterAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    try {
      // Fetch all job items (no filters applied)
      const items = await queryJobBoardItems();

      // Update the modal to show the job board with no filters
      await slack.client.views.update({
        view_id: payload.view?.id,
        hash: payload.view?.hash,
        view: getJobBoardModal({
          items,  // Pass items to populate the modal
        }),
      });
    } catch (error) {
      console.error("Error returning to job board:", error);
    }
  }
);

export const viewJobBoardInNotionAction = "view_job_board_in_notion";

/** Acknowledges when the user clicks the 'View in Notion' button. */
slack.action(viewJobBoardInNotionAction, async (_) => {});