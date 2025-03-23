import { MessageEventHandler, SlackApp, SlackAppEnv } from "slack-edge";
import { slackSigningSecret, slackBotToken } from "./constants";
import { Channel } from "slack-web-api-client/dist/client/generated-response/ConversationsListResponse";

/**
 * The api client used to access the slack api and handle events.
 */
export const slack = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackBotToken,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

/**
 * Helper method to register multiple independent message handlers.
 *
 * Needed because [slack.anyMessage] can only be used once.
 */
export function anyMessage(handler: MessageEventHandler<SlackAppEnv>) {
  handlers.push(handler);
}

const handlers: MessageEventHandler<SlackAppEnv>[] = [];

slack.anyMessage(async (request) => {
  await Promise.all(handlers.map((h) => h(request)));
});

/**
 * Fetches the list of all public Slack channels.
 */
export async function getPublicChannels() {
  let channels = new Map<string, Channel>();

  let hasMore = true;
  let nextCursor: string | undefined = undefined;

  while (hasMore) {
    const response = await slack.client.conversations.list({
      exclude_archived: true,
      cursor: nextCursor,
      types: "public_channel",
    });

    nextCursor = response.response_metadata?.next_cursor;
    hasMore = !!nextCursor;

    for (let channel of response.channels ?? []) {
      channels.set(channel.id!, channel);
    }
  }

  return channels;
}

export async function getChannelById(channelId: string) {
  const response = await slack.client.conversations.info({
    channel: channelId,
  });
  const channel = response.channel as Channel;
  return channel.name;
}
