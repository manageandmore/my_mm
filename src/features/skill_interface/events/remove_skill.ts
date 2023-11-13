import { AckResponse, ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { updateHomeViewForUser } from "../../home/event";
import { getEditSkillsModal } from "../modals/edit_skills";

export const removeSkillItemAction = "remove_skill_item";


/**
 * This event is triggered when the user clicks the "Remove Skill" button
 */
slack.action(removeSkillItemAction, async (request) => {
  const payload = request.payload;
  const action = payload.actions[0] as ButtonAction;
  const skillList = JSON.parse(payload.view!.private_metadata);
  //TODO remove skill item from notion page

  try {
    const items = skillList.items ?? [];
    for(const skill of items){
        if(skill.id === action.value){
            skill.status = "removed";
        }
    }

    await slack.client.views.update({
      view: getEditSkillsModal(skillList),
      view_id: payload.view?.root_view_id ?? "",
    });

    //update home view
    await updateHomeViewForUser(payload.user.id);
  } catch (error) {
    console.error("Error handling the view submission: ", error);
    // Handle errors, possibly informing the user
  }
});
