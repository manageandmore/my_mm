import { ModalView } from "slack-edge";
import { newSkillItemCallback } from "../events/add_skill";

/**
 * Constructs the modal for adding a skill to the skill database.
 *
 * @returns The modal view.
 */
export function getNewSkillModal(): ModalView {
  return {
    type: "modal",
    callback_id: newSkillItemCallback,
    title: {
      type: "plain_text",
      text: "New Skill",
      emoji: false,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Add a new skill of yours to the skill database. You can choose between the skill levels *Beginner*, *Intermediate* and *Advanced*.",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "skill_name",
        label: {
          type: "plain_text",
          text: "Skill Name",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "skill_name_input",
          multiline: false,
          min_length: 4,
          max_length: 25,
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "skill_level",
        label: {
          type: "plain_text",
          text: "Skill Level",
          emoji: true,
        },
        element: {
          type: "static_select",
          action_id: "skill_level_select",
          placeholder: {
            type: "plain_text",
            text: "Select a level",
            emoji: true,
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Expert",
                emoji: true,
              },
              value: "Expert",
            },
            {
              text: {
                type: "plain_text",
                text: "Intermediate",
                emoji: true,
              },
              value: "Intermediate",
            },
            {
              text: {
                type: "plain_text",
                text: "Beginner",
                emoji: true,
              },
              value: "Beginner",
            },
          ],
        },
      },
    ],
  };
}
