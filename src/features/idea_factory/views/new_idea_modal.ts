import {ModalView, PlainTextOption} from "slack-edge";
import { newIdeaFactoryItemCallback } from "../events/new_idea";
import {IdeaCategory} from "../data/get_categories";

/**
 * Constructs the modal for adding a new suggestion to the idea_factory.
 *
 * @returns The modal view.
 */
export function getNewIdeaModal(categories: IdeaCategory[]): ModalView {
  const slackOptions = categories.map(option => ({
    text: { type: "plain_text", text: option.text },
    value: option.value,
  })) as PlainTextOption[];
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
        hint: {
          type: "plain_text",
          text: "Give your idea a catchy title. It will be the first impression!",
        },
        element: {
          type: "plain_text_input",
          action_id: "title",
          multiline: false,
          min_length: 3,
          max_length: 100,
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "pitch",
        label: {
          type: "plain_text",
          text: "Pitch",
          emoji: true,
        },
        hint: {
          type: "plain_text",
          text: "The pitch is displayed below the title of your idea in the overview.",
        },
        element: {
          type: "plain_text_input",
          action_id: "pitch",
          multiline: true,
          min_length: 1,
          max_length: 200,
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
        optional: true,
        hint: {
          type: "plain_text",
          text: "The description is only displayed on Notion and can provide more elaborate information.",
        },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
          min_length: 0,
          max_length: 500,
        },
      },
      {
        type: "input",
        block_id: "category_select",
        optional: false,
        element: {
          type: "static_select",
          action_id: "category_selection",
          placeholder: { type: "plain_text", text: "Select a category" },
          options: slackOptions,
        },
        label: { type: "plain_text", text: "Category" },
      },
    ],
  };
}
