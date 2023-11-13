import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getAddSkillModal } from "../modals/add_skill";
import { getSkillEditStatusModal } from "../modals/skill_status";
import { getEditSkillsModal } from "../modals/edit_skills";
import { SkillItems, SkillItem } from "../data/skill_stack";

export const addSkillItemAction = "new_skill_item";

/**
 * Opens a modal for adding a new skill.
 */
slack.action(addSkillItemAction, async (request) => {
  const payload = request.payload;
  const skillList = await JSON.parse(payload.view!.private_metadata);
  const view = await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: getAddSkillModal(skillList),
  });
});

export const newSkillItemCallback = "new_skill_item";

/**
 * Executes the callback for adding a new skill.
 */
slack.viewSubmission(
  newSkillItemCallback,
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;
    const skillList = JSON.parse(payload.view.private_metadata);
    try {
      //utc String as temporary id as notion page was not created yet
      const currentDate = new Date();
      const utcString = currentDate.toISOString();

      const skill: SkillItem = {
        id: utcString,
        scholar: await getScholarIdFromUserId(payload.user.id),
        skillName: values.skill_name.skill_name_input.value!,
        skillLevel:
          values.skill_level.skill_level_select.selected_option!.value,
        status: "new",
      };

      skillList.items!.push(skill);
      console.log("skillListAdded",skillList);
      await slack.client.views.update({
        view_id: payload.view.root_view_id!,
        view: getEditSkillsModal(skillList),
      });
    } catch (error) {
      console.error("Error handling the view submission: ", error);
      // Handle errors, possibly informing the user
    }
  }
);
