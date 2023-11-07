/**
 * Detects messages containing keywords related to community credits and prompts the user to post them in the community credits channel.
 * @param request - The Slack message request.
 * @returns A Slack message with a button to create a post in the community credits channel.
 */
import { ButtonAction, DataSubmissionView, FileItem } from "slack-edge";
import { slack } from "../../slack";
import { getUserById } from "../common/id_utils";

const communityCreditsRegexPattern =
  /\b(?:community\s*[-]?credits?|community\s*[-]?points?|credits?|helper\s*points?|helferpunkte?)\b/i;

// helper function to get the channel id for the community credits channel
const getCommunityCreditsChannelId = async () => {
  return await slack.client.conversations
    .list({
      exclude_archived: true,
      types: "public_channel",
    })
    .then((response) => {
      return response.channels?.find((channel) => {
        return channel.name === "community_credits";
      })?.id;
    });
};

slack.message(communityCreditsRegexPattern, async (request) => {
  const payload = request.payload;

  // find chanel id for community credits channel
  const communityCreditsChannelId = await getCommunityCreditsChannelId();
  const channel = communityCreditsChannelId
    ? `<#${communityCreditsChannelId}>`
    : "#community-credits";

  const messageText = payload.text;
  const replyText = `Would you like to add this message to the ${channel} channel?`;

  // check that the message is not already in the community credits channel
  if (payload.channel === communityCreditsChannelId) {
    return;
  }

  // reply to the message
  await slack.client.chat.postEphemeral({
    channel: payload.channel,
    user: payload.user!,
    text: replyText,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: replyText,
        },
        accessory: {
          type: "button",
          action_id: createCommunityPostAction,
          text: {
            type: "plain_text",
            text: `Post in #community_credits`,
            emoji: true,
          },
          style: "primary",
          value: messageText,
        },
      },
    ],
  });
});

export const createCommunityPostAction = "create_community_credits_post";

slack.action(createCommunityPostAction, async (request) => {
  const payload = request.payload;
  const communityCreditsChannelId = await getCommunityCreditsChannelId();
  const text = (payload.actions[0] as ButtonAction).value;

  if (!communityCreditsChannelId) {
    return;
  }

  const user = await getUserById(payload.user.id);

  await slack.client.chat.postMessage({
    channel: communityCreditsChannelId,
    username: user?.profile?.display_name || user?.real_name || user?.name,
    icon_url:
      user?.profile?.image_192 ??
      user?.profile?.image_512 ??
      user?.profile?.image_original,
    text: text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Originally posted in <#${payload.channel!.id}>`,
          },
        ],
      },
    ],
  });
});
