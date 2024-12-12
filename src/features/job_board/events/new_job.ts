import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getNewJobModal } from "../views/new_job_modal";
import { getJobBoardModal } from "../views/job_board_modal";
import { queryJobBoardItems } from "../data/query_jobs";
import { addJobBoardItem } from "../data/add_job";

export const newJobBoardItemAction = "new_job_board_item";
export const newJobBoardItemFromEphemeralAction = "new_job_board_from_ephemeral_item";

/**
 * Opens the modal for adding a new job when the user clicks the 'Add Job' button.
 */
slack.action(newJobBoardItemAction, async (request) => {
  const payload = request.payload;

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: getNewJobModal(),
  });
});

/**
 * Opens the modal for adding a new job when the user clicks the Create Job Posting button
 * from the ephemeral message.
 *
 * This is different from the method above as this *opens* the modal instead of pushing it onto
 * the current open modal, as we cannot push a modal from a ephemeral message.
 */
slack.action(newJobBoardItemFromEphemeralAction, async (request) => {
    const payload = request.payload;

    await slack.client.views.open({
        trigger_id: payload.trigger_id,
        view: getNewJobModal(),
    });
})

export const newJobBoardItemCallback = "new_job_board_item";

slack.viewSubmission(
    newJobBoardItemCallback,
    async (_) => {
        console.log("Modal is open for data submission.");
    },
    async (request) => {
        try {
            const payload = request.payload;

            const values = payload.view.state.values;

            // We specifically use the name here in order to make it readable for people
            // looking at the Notion page.
            const scholarName = await getScholarIdFromUserId(payload.user.name);

            const newJobBoardItem = {
                title: values.title.title.value!,
                jobDescription: values.description.description.value!,
                createdBy: scholarName,
                applicationDeadline: values.applicationDeadline?.applicationDeadline.selected_date
                    ? new Date(values.applicationDeadline.applicationDeadline.selected_date)
                    : null,
                company: values.company.company.value || "",
                contactEmail: values.contactEmail?.contactEmail?.value || null,
                jobType: values.jobType.jobType.selected_option?.text.text || "Other",
                startDate: values.startDate?.startDate?.selected_date
                    ? new Date(values.startDate.startDate.selected_date)
                    : null,
                websiteLink: values.websiteLink?.websiteLink?.value || null,
            };

            await addJobBoardItem(newJobBoardItem);
            const items = await queryJobBoardItems();
            await slack.client.views.update({
                view_id: payload.view.root_view_id!,
                view: getJobBoardModal({ items }),
            });

            console.log("Job board updated successfully.");
        } catch (error) {
            console.error("Error handling view submission: ", error);
        }
    }
);
