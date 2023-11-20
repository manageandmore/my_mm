import { Button } from "slack-edge";
import { slack } from "../../../slack";
import { sendGetStartedMessage } from "./shortcut";
import { currentUrl } from "../../../constants";
import { features } from "../../common/feature_flags";
import { postCreatorFeatureFlag } from "..";

const createPostAction = "create_post_button_action";

slack.action(createPostAction, async (request) => {
  await slack.client.views.open({
    trigger_id: request.payload.trigger_id,
    view: {
      type: "modal",
      callback_id: createPostCallback,
      title: {
        type: "plain_text",
        text: "📸 Social Media Post",
      },
      submit: {
        type: "plain_text",
        text: "Get started",
      },
      close: {
        type: "plain_text",
        text: "Got it",
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "✨ Create awesome *branded social media posts* for Manage And More in just a few clicks, without ever leaving Slack. " +
              "After *creating an image* like this, you can download it or directly *add it to the official content calendar*.",
          },
          accessory: {
            type: "image",
            image_url: `https://${currentUrl}/assets/post_example.png`,
            alt_text: "Example Post",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "To get started click the button below and simply send an image to the app using the *Messages* tab above.",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🤝 In collaboration with your *IP Marketing*.",
            },
          ],
        },
      ],
    },
  });
});

const createPostCallback = "create_post_modal_callback";

slack.viewSubmission(createPostCallback, async (request) => {
  const payload = request.payload;

  await sendGetStartedMessage(payload.user.id);
});

export async function getCreatePostButton(
  userId: string
): Promise<Button | null> {
  const isEnabled = await features.check(postCreatorFeatureFlag, userId);
  if (!isEnabled) {
    return null;
  }

  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "📸 Create Social Media Post",
      emoji: true,
    },
    action_id: createPostAction,
  };
}
