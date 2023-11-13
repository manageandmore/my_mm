import { slack } from "../../../slack";
import { updateHomeViewForUser } from "../../home/event";
import { updateNotionDatabase } from "../data/edit_skills";
import { getSkillsByScholar } from "../data/query_skills";
import { getEditSkillsModal } from "../modals/edit_skills";
import { getSkillEditStatusModal } from "../modals/skill_status";

export const editSkillItemsAction = "edit_skill_items";

/**
 * This event is triggered when the user clicks the "Edit Skills" button
 */
slack.action(editSkillItemsAction, async (request) => {
  const payload = request.payload;

  var skillList = await getSkillsByScholar(payload.user.id);

  const view = await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getEditSkillsModal(skillList),
  });
});

/**
 * This event is triggered when the user clicks the "Submit changes" button
 */
slack.viewSubmission(
  editSkillItemsAction,
  async (request) => {
    const payload = request.payload;
    try {
      return {
        response_action: "update",
        view: getSkillEditStatusModal(true),
      };
    } catch (error) {
      console.error("Error handling the view submission: ", error);
      return {
        response_action: "update",
        view: getSkillEditStatusModal(true),
      };
    }
  },
  async (request) => {
    const payload = request.payload;
    const skillList = JSON.parse(payload.view.private_metadata);
    //update home view
    await updateNotionDatabase(skillList, payload.user.id);
    await updateHomeViewForUser(payload.user.id);
  }
);
