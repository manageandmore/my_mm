import { AnyModalBlock, Button, ModalView } from "slack-edge";
import { SkillItems, SkillItem } from "../data/skill_stack";
import { addSkillItemAction } from "../events/add_skill";
import { editSkillItemsAction } from "../events/edit_skills";
import { removeSkillItemAction } from "../events/remove_skill";

/**
 * Constructs the modal for adding a skill to the skill database.
 *
 * @returns The modal view.
 */
export function getEditSkillsModal(
  options: SkillItems
): ModalView {
  console.log("skill List", options);
  const metadata = JSON.stringify(options);
  let blocks: AnyModalBlock[];
  if (options.items == null) {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            emoji: true,
            text: "No skills found... Ufff, thats gotta hurt! Luckily you can add some new skills below.",
          },
        ],
      },
    ];
  } else {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Delete or add new Skills",
          },
        ],
      },
      {
        type: "divider",
      },
    ];
    for (let item of options.items) {
      if (item.status !== "removed") {
        blocks = blocks.concat(getSkillItem(item, options));
      }
    }
    blocks = blocks.concat([
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Skill",
              emoji: true,
            },
            style: "primary",
            action_id: addSkillItemAction,
            value: JSON.stringify(options),
          },
        ],
      },
    ]);
  }

  return {
    type: "modal",
    private_metadata: metadata,
    callback_id: editSkillItemsAction,
    notify_on_close: true,
    title: {
      type: "plain_text",
      text: "Skill List",
      emoji: true,
    },
    blocks: blocks,
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    submit: {
      type: "plain_text",
      text: "Submit changes",
      emoji: true,
    },
  };
}

function getSkillItem(item: SkillItem, skillList: SkillItems): AnyModalBlock[] {
  return [
    {
      type: "section",
      block_id: item.id,
      text: {
        type: "mrkdwn",
        text: `*${item.skillName}* \`${item.skillLevel}\``,
      },
      accessory: getDeleteButton(item.id, skillList),
    },
    {
      type: "divider",
    },
  ];
}

function getDeleteButton(skillId: string, skillList: SkillItems): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      emoji: true,
      text: "Delete Skill",
    },
    action_id: removeSkillItemAction,
    value: skillId,
    //value: JSON.stringify(skillList),
  };
}
