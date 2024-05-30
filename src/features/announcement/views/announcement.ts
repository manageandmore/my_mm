import { ModalView } from "slack-edge";
import { previewAnnouncementCallback } from "../events/announcement";

/**
 * Constructs the modal view for the announcement creator.
 *
 * @returns The modal view.
 */
export function getAnnouncementCreatorModal(): ModalView {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "📢 Create Announcement",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Preview",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    callback_id: previewAnnouncementCallback,
    blocks: [
      {
        type: "input",
        block_id: "message",
        label: {
          type: "plain_text",
          text: "Message",
          emoji: true,
        },
        element: {
          type: "rich_text_input",
          action_id: "message",
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "channel",
        label: {
          type: "plain_text",
          text: "Channel",
          emoji: true,
        },
        element: {
          type: "conversations_select",
          action_id: "channel",
          placeholder: {
            type: "plain_text",
            text: "Select channel",
            emoji: true,
          },
        },
      },
    ],
  };
}
