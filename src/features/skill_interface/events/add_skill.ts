import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getNewSkillModal } from "../views/new_skill_modal";
import { getSkillConfirmedModal } from "../views/skill_confirmed_modal";
import { addSkillItem } from "../data/add_item";
import { updateHomeViewForUser } from "../../home/event";

export const newSkillItemAction = "new_skill_item";

/**
 * Opens a the modal for adding a new suggestion when the user clicks the 'Add Suggestion' button.
 */
slack.action(newSkillItemAction, async (request) => {
  const payload = request.payload;

  const view = await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getNewSkillModal(),
  });
});

export const newSkillItemCallback = "new_skill_item";

slack.viewSubmission(
  newSkillItemCallback,
  async (_) => {
    return {
      response_action: "update",
      view: getSkillConfirmedModal(),
    };
  },
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;
    try {
      // Acknowledge the view submission event
      //await ack();
      //console.log(payload);
      // Parse out the values from the submission

      const scholarId = await getScholarIdFromUserId(payload.user.id);

      // Add the skill item
      await addSkillItem({
        name: values.skill_name.skill_name_input.value!,
        skillLevel:
          values.skill_level.skill_level_select.selected_option?.value ||
          "Undefined",
        createdBy: scholarId,
      });

      //update home view
      await updateHomeViewForUser(payload.user.id);
    } catch (error) {
      console.error("Error handling the view submission: ", error);
      // Handle errors, possibly informing the user
    }
  }
);
