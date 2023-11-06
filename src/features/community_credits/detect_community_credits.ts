import { ButtonAction, DataSubmissionView, FileItem } from "slack-edge";
import { slack } from "../../slack";

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
  await slack.client.chat.postMessage({
    channel: payload.channel,
    text: replyText,
    thread_ts: payload.event_ts,
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
            text: "Create Community Credits Post",
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

  if (!payload.message || !communityCreditsChannelId) {
    return;
  }

  await slack.client.chat.postMessage({
    channel: communityCreditsChannelId,
    text: text,
  });
});
