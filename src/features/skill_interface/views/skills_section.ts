import { AnyHomeTabBlock } from "slack-edge";
import { SkillListPerLevel } from "../data/query_skills";
import { addSkillItemAction } from "../events/add_skill";
import { editSkillItemsAction } from "../events/edit_skills";

export function getSkillsSection(skills: SkillListPerLevel): AnyHomeTabBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Skills",
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `🧑‍🏫 *Beginner*: ${(skills.beginner || ["/"])
            .map((s) => `\`${s}\``)
            .join(" · ")}\n` +
          `🦸 *Intermediate*: ${(skills.intermediate || ["/"])
            .map((s) => `\`${s}\``)
            .join(" · ")}\n` +
          `🥷 *Expert*: ${(skills.expert || ["/"])
            .map((s) => `\`${s}\``)
            .join(" · ")}\n`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "✨ Edit Skills",
          },
          action_id: editSkillItemsAction,
        },
      ],
    },
  ];
}
