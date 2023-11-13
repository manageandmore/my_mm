import { slack } from "../../../slack";
import { updateHomeViewForUser } from "../../home/event";
import { updateNotionDatabase } from "../data/edit_skills";
import { getSkillsByScholar } from "../data/query_skills";
import { getEditSkillsModal } from "../modals/edit_skills";
import { getSkillEditStatusModal } from "../modals/skill_status";

export const editSkillItemsAction = "edit_skill_items";

/**
 *
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
slack.viewClosed(editSkillItemsAction, async (request) => {
  const payload = request.payload;
  const skillList = payload.view.private_metadata as SkillItems;
  console.log(request);
  try {
    //updating notion database
    await updateNotionDatabase(skillList, payload.user.id);
    //update home view
    await updateHomeViewForUser(payload.user.id);
  } catch (error) {
    console.error("Error handling the view submission: ", error);
    // Handle errors, possibly informing the user
  }
});
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
