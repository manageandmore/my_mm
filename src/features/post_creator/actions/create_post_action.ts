import { Button } from "slack-edge";
import { slack } from "../../../slack";
import { sendGetStartedMessage } from "./shortcut";
import { currentUrl } from "../../../constants";
import { notionEnv } from "../../../constants";

/** The id of the channel where social media posts are discussed. */
export const socialMediaChannelId =
  notionEnv == "production" ? "C0704C5B3SQ" : "C0694MW7XJN";

const createPostAction = "create_post_button_action";
// Alternative action: Responds to the user pushing the create post button on home view to use the content channel regarding any social media posts instead of using feature. Change action id in getCreatePostButton and in anymessage in ./create_post.ts to function that you want to use.
export const forwardToChannelAction = "forward_to_channel_action";

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

/**
 * Responds to the user pushing the create post button on home view to use the content channel regarding any social media posts
 */
slack.action(forwardToChannelAction, async (request) => {
  await slack.client.chat.postMessage({
    channel: request.payload.user.id,
    text: `Hi 👋,\n\nfor any ideas regarding Social Media Posts, please use the <#${socialMediaChannelId}> channel.\nIf you have a picture and specific text in mind please post them and a quick explanation also in the channel.\n\n Thank you!`,
  });
});

export async function getCreatePostButton(userId: string): Promise<Button> {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "📸 Create Social Media Post",
      emoji: true,
    },
    //action_id: createPostAction,
    action_id: forwardToChannelAction,
  };
}
