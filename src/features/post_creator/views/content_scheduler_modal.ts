import { ModalView } from "slack-edge";
import { addToCalendarCallback } from "../actions/add_to_calendar";
import { PostCreatorOptions, getPostImageUrl } from "../image_utils";

export type ContentSchedulerModalOptions = {
  previewImageUrl: string;
  imageUrl: string;
};

/**
 * Constructs the modal view for the social post scheduler.
 *
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
export function getContentSchedulerModal(
  options: PostCreatorOptions,
  info: { channels: string[]; ips: string[] }
): ModalView {
  const previewImageUrl = getPostImageUrl({ ...options, size: 200 });

  return {
    type: "modal",
    private_metadata: JSON.stringify(options),
    title: {
      type: "plain_text",
      text: "Add to Content Calendar",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Add",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    callback_id: addToCalendarCallback,
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "Enter the post content and date to add this to the content calendar.",
        },
        accessory: {
          type: "image",
          image_url: previewImageUrl,
          alt_text: "Post Preview",
        },
      },
      {
        type: "input",
        block_id: "content",
        label: {
          type: "plain_text",
          text: "Post Content",
          emoji: true,
        },
        element: {
          type: "rich_text_input",
          action_id: "content",
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "date",
        label: {
          type: "plain_text",
          text: "Date",
          emoji: true,
        },
        element: {
          type: "datepicker",
          action_id: "date",
          initial_date: (() => {
            var date = new Date();
            date.setDate(date.getDate() + 2);
            return date.toISOString().substring(0, 10);
          })(),
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        block_id: "ips",
        text: {
          type: "mrkdwn",
          text: "Tag an IP",
        },
        accessory: {
          type: "multi_static_select",
          action_id: "ips",
          options: info.ips.map((ip) => ({
            text: { type: "plain_text", text: ip },
          })),
        },
      },
      {
        type: "section",
        block_id: "channels",
        text: {
          type: "mrkdwn",
          text: "Select Channels",
        },
        accessory: {
          type: "multi_static_select",
          action_id: "channels",
          options: info.channels.map((c) => ({
            text: { type: "plain_text", text: c },
          })),
        },
      },
    ],
  };
}
