import { slack } from "../../../slack";

const createSocialPostShortcut = "create_social_post";

/**
 * Shows a helpful starting message when the user triggers the 'Create Social Post' shortcut.
 */
slack.globalShortcut(createSocialPostShortcut, async (request) => {
  const payload = request.payload;

  await sendGetStartedMessage(payload.user.id);
});

export async function sendGetStartedMessage(userId: string) {
  await slack.client.chat.postMessage({
    channel: userId,
    text: "Send me an image to get started with the post creation.",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "Hi 👋\n\nLooks like you want to create a social media post four our amazing *ManageAndMore Socials*.\n" +
            "To get started, simply *send me a message* in this chat *containing the image* that you want to use for the post.",
        },
      },
    ],
  });
}
