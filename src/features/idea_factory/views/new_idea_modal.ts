import { ModalView } from "slack-edge";
import { newIdeaFactoryItemCallback } from "../events/new_suggestion";

/**
 * Constructs the modal for adding a new suggestion to the idea_factory.
 *
 * @returns The modal view.
 */
export function getNewIdeaModal(): ModalView {
  return {
    type: "modal",
    callback_id: newIdeaFactoryItemCallback,
    title: {
      type: "plain_text",
      text: "Add New Idea 💡",
      emoji: true,
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
            text: "Add a new idea for improving the program. Try to be concise and specific, so others can vote on your idea.",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "title",
        label: {
          type: "plain_text",
          text: "Title",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "title",
          multiline: false,
          min_length: 10,
          max_length: 100,
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "description",
        label: {
          type: "plain_text",
          text: "Description",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
          min_length: 20,
          max_length: 200,
        },
      },
    ],
  };
}
