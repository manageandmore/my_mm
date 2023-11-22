import { ModalView } from "slack-edge";
import {
  createSocialPostCallback,
  updateSocialPostAction,
} from "../actions/create_post";
import { PostCreatorOptions, getPostImageUrl } from "../image_utils";

/**
 * Constructs the modal view for the social post creator.
 *
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
export function getPostCreatorModal(options: PostCreatorOptions): ModalView {
  const imageUrl = getPostImageUrl(options);

  return {
    type: "modal",
    private_metadata: JSON.stringify(options),
    title: {
      type: "plain_text",
      text: "🪄 Post Creator",
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
    callback_id: createSocialPostCallback,
    blocks: [
      {
        type: "image",
        image_url: imageUrl,
        alt_text: "Post Preview",
      },
      {
        type: "input",
        block_id: "title",
        dispatch_action: true,
        label: {
          type: "plain_text",
          text: "Title",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: updateSocialPostAction,
          multiline: false,
          max_length: 60,
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "subtitle",
        dispatch_action: true,
        label: {
          type: "plain_text",
          text: "Subtitle",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: updateSocialPostAction,
          max_length: 40,
        },
        optional: true,
      },
      {
        type: "divider",
      },
      {
        type: "section",
        block_id: "logo_position",
        text: {
          type: "mrkdwn",
          text: "*Select Logo Position*",
        },
        accessory: {
          type: "static_select",
          action_id: updateSocialPostAction,
          placeholder: {
            type: "plain_text",
            emoji: true,
            text: "Logo Position",
          },
          initial_option: {
            text: {
              type: "plain_text",
              text: "Top",
            },
            value: "top",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Top",
              },
              value: "top",
            },
            {
              text: {
                type: "plain_text",
                text: "Bottom",
              },
              value: "bottom",
            },
          ],
        },
      },
      {
        type: "section",
        block_id: "title_alignment",
        text: {
          type: "mrkdwn",
          text: "*Select Title Alignment*",
        },
        accessory: {
          type: "static_select",
          action_id: updateSocialPostAction,
          placeholder: {
            type: "plain_text",
            emoji: true,
            text: "Title Alignment",
          },
          initial_option: {
            text: {
              type: "plain_text",
              text: "Left",
            },
            value: "left",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Left",
              },
              value: "left",
            },
            {
              text: {
                type: "plain_text",
                text: "Right",
              },
              value: "right",
            },
          ],
        },
      },
      {
        type: "section",
        block_id: "title_color",
        text: {
          type: "mrkdwn",
          text: "*Select Title Color*",
        },
        accessory: {
          type: "static_select",
          action_id: updateSocialPostAction,
          placeholder: {
            type: "plain_text",
            emoji: true,
            text: "Title Color",
          },
          initial_option: {
            text: {
              type: "plain_text",
              text: "White",
            },
            value: "white",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "White",
              },
              value: "white",
            },
            {
              text: {
                type: "plain_text",
                text: "Blue",
              },
              value: "#00A2CD",
            },
            {
              text: {
                type: "plain_text",
                text: "Yellow",
              },
              value: "#FFED00",
            },
          ],
        },
      },
    ],
  };
}
