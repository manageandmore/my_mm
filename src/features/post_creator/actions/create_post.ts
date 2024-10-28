import { ButtonAction, DataSubmissionView, FileItem } from "slack-edge";
import { anyMessage, slack } from "../../../slack";
import { getPostCreatorModal } from "../views/post_creator_modal";
import { addToCalendarAction } from "./add_to_calendar";
import { PostCreatorOptions, getPostImageUrl } from "../image_utils";
import { forwardToChannelAction } from "./create_post_action";

/**
 * Shows a "Create Social Media Post" button whenever the user sends an image to the app.
 */
anyMessage(async (request) => {
  const payload = request.payload;

  // Guard for direct messages to the app.
  if (payload.channel_type != "im") {
    return;
  }

  // Guard for file messages.
  if (
    payload.subtype != "file_share" ||
    payload.files == null ||
    payload.files.length != 1
  ) {
    return;
  }

  const file = payload.files![0] as any as FileItem;

  // Guard for image files.
  if (!["jpg", "jpeg", "png"].includes(file.filetype)) {
    return;
  }

  await slack.client.chat.postMessage({
    channel: payload.channel,
    text: "What a nice image. Do you want to turn it into a social media post?",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "What a nice image. ✨\nDo you want to turn it into a social media post?",
        },
        accessory: {
          type: "button",
          //action_id: createSocialPostAction,
          action_id: forwardToChannelAction,
          text: {
            type: "plain_text",
            text: "Create Social Media Post",
            emoji: true,
          },
          style: "primary",
          value: file.id,
        },
      },
    ],
  });
});

export const createSocialPostAction = "create_social_post";

/**
 * Opens the post creator modal when the user clicks the "Create Social Media Post" button.
 */
slack.action(createSocialPostAction, async (request) => {
  const payload = request.payload;

  const fileId = (payload.actions[0] as ButtonAction).value;

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getPostCreatorModal({
      size: 300, // Generate a low-resolution preview.
      file: fileId,
    }),
  });
});

export const updateSocialPostAction = "update_social_post";

/**
 * Updates the post creator modal whenever the user changes some values inside the modal.
 */
slack.action(updateSocialPostAction, async (request) => {
  const payload = request.payload;

  if (payload.view == null) {
    return;
  }

  const options = getPostOptionsFromView(payload.view);

  await slack.client.views.update({
    view_id: payload.view!.id,
    view: getPostCreatorModal({
      ...options,
      size: 300, // Generate a low-resolution preview.
    }),
  });
});

export const createSocialPostCallback = "create_social_post_callback";

/**
 * Sends back the created post image when the user submits the post creator modal.
 */
slack.viewSubmission(
  createSocialPostCallback,
  async (request) => {
    return {
      response_action: "clear",
    };
  },
  async (request) => {
    const payload = request.payload;

    const options = getPostOptionsFromView(payload.view);

    // Generate a high resolution image for downloading.
    const downloadImageUrl = getPostImageUrl(
      { ...options, size: 1200 },
      { encode: true, download: true }
    );

    // Generate a mid-resolution preview image.
    const previewImageUrl = getPostImageUrl(
      { ...options, size: 600 },
      { encode: true }
    );

    await slack.client.chat.postMessage({
      channel: payload.user.id,
      text: "Here is your finished post.",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Here is your finished post.",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Download",
            },
            url: downloadImageUrl,
          },
        },
        {
          type: "image",
          image_url: previewImageUrl,
          alt_text: "Preview Image",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Should I add this post to the content calendar?",
          },
          accessory: {
            type: "button",
            action_id: addToCalendarAction,
            text: {
              type: "plain_text",
              text: "Add to Content Calendar",
            },
            style: "primary",
            value: JSON.stringify(options),
          },
        },
      ],
    });
  }
);

interface PostCreatorModalState {
  title?: { [updateSocialPostAction]: { value: string } };
  subtitle?: { [updateSocialPostAction]: { value: string } };
  image_url?: { [updateSocialPostAction]: { value: string } };
  logo_position?: {
    [updateSocialPostAction]: { selected_option?: { value: string } };
  };
  title_alignment?: {
    [updateSocialPostAction]: { selected_option?: { value: string } };
  };
  title_color?: {
    [updateSocialPostAction]: { selected_option?: { value: string } };
  };
}

function getPostOptionsFromView(
  view: DataSubmissionView | undefined
): PostCreatorOptions {
  if (view == null) return {};
  const state = view.state.values as PostCreatorModalState;
  const data = JSON.parse(view.private_metadata) as PostCreatorOptions;

  return Object.assign(data, {
    title: state.title?.[updateSocialPostAction].value,
    subtitle: state.subtitle?.[updateSocialPostAction].value,
    image: state.image_url?.[updateSocialPostAction].value,
    logoPosition:
      state.logo_position?.[updateSocialPostAction].selected_option?.value,
    titleAlignment:
      state.title_alignment?.[updateSocialPostAction].selected_option?.value,
    titleColor:
      state.title_color?.[updateSocialPostAction].selected_option?.value,
  });
}
