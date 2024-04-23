import { AnyHomeTabBlock } from "slack-edge";
import { SkillListPerLevel } from "../data/query_skills";
import { editSkillItemsAction } from "../events/edit_skills";

export function getSkillsSection(skills: SkillListPerLevel): AnyHomeTabBlock[] {
  
  
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `🥋 *Skills*: `+
          `\`Beginner\` ${skills.beginner.join(", ")} · `+
          `\`Intermediate\` ${skills.intermediate.join(", ")} · `+
          `\`Expert\` ${skills.expert.join(", ")}`,
      },
      accessory: {
        type: "button",
        action_id: editSkillItemsAction,
        text: {
          type: "plain_text",
          text: "Edit",
        },
      }
    },
  ];
}
