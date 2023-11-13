import { AnyHomeTabBlock } from "slack-edge";
import { SkillItem } from "../data/query_skills";
import { newSkillItemAction } from "../events/add_skill";

export function getSkillsSection(skills: SkillItem): AnyHomeTabBlock[] {
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
          `🧑‍🏫 *Beginner*: ${(skills.beginnerSkills || ["/"])
            .map((s) => `\`${s}\``)
            .join(" · ")}\n` +
          `🦸 *Intermediate*: ${(skills.intermediateSkills || ["/"])
            .map((s) => `\`${s}\``)
            .join(" · ")}\n` +
          `🥷 *Expert*: ${(skills.expertSkills || ["/"])
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
            text: "✨ Add Skill",
          },
          action_id: newSkillItemAction,
        },
      ],
    },
  ];
}
