import { getVectorStore } from "../ai/chain";
import { getPublicChannels, slack } from "../../../slack";
import { ONE_DAY } from "../../common/time_utils";
import { User, getUserById } from "../../common/id_utils";
import { toUUID } from "../../common/utils";
import { Document } from "@langchain/core/documents";
import { Task, TaskOptions } from "../../common/task_utils";

/**
 * Background task that syncs all messages from the indexed channels of the last 30 days.
 */
export const syncSlackTask: Task<
  SyncChannelInfo,
  SyncChannelOptions & TaskOptions
> = {
  name: "sync slack",
  run: loadSlackChannels,
  display(data) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Completed loading ${data.messages} messages from channel #${data.channel}`,
        },
      },
    ];
  },
};

export type SyncChannelInfo = {
  channel: string;
  messages: number;
};

export type SyncChannelOptions = {
  channels: string[];
  botUserId: string;
};

/**
 * Syncs all messages from the indexed channels of the last 30 days.
 */
async function loadSlackChannels(
  options: SyncChannelOptions,
  report?: (info: SyncChannelInfo) => Promise<void>
) {
  try {
    const vectorStore = await getVectorStore();
    const channels = await getPublicChannels();

    const users = new Map<string, User>();

    for (let [channelId, channel] of channels) {
      if (!options.channels.includes(channel.name ?? "*")) {
        continue;
      }

      let hasMore = true;
      let currentCursor: string | undefined = undefined;

      let messagesAdded = 0;

      // Load the paginated messages from the last 30 days in this channel.
      while (hasMore) {
        const response = await slack.client.conversations.history({
          channel: channelId,
          oldest: (Date.now() / 1000 - ONE_DAY * 30).toString(),
          inclusive: true,
          cursor: currentCursor,
          limit: 500,
        });

        hasMore = response.has_more ?? false;
        currentCursor = response.response_metadata?.next_cursor;

        for (let message of response.messages ?? []) {
          // Ignore bot messages.
          if (message.subtype == "bot_message") {
            continue;
          }

          // Ignore messages that mentions this app.
          if (message.text!.includes(`<@${options.botUserId}>`)) {
            continue;
          }

          var documentId = await getMessageDocumentId(channelId, message.ts!);

          var user =
            users.get(message.user ?? "") ??
            (await getUserById(message.user ?? ""));

          // Prepare the document.
          var document = await messageToDocument({
            text: message.text!,
            ts: message.ts!,
            channel: { id: channelId, name: channel.name! },
            user: { id: message.user, name: user?.real_name ?? user?.name },
            autoIndexed: true,
          });

          // Add it to the vector database.
          await vectorStore.addDocuments([document], { ids: [documentId] });

          messagesAdded++;
        }
      }

      report?.({
        channel: channel.name!,
        messages: messagesAdded,
      });
    }
  } catch (e: any) {
    console.log("Error at syncing slack index", e, e.message, e.errors);
    throw e;
  }
}

/**
 * Returns a unique id for a message.
 */
export async function getMessageDocumentId(
  channelId: string,
  messageTs: string
) {
  return toUUID(channelId + ":" + messageTs);
}

type Message = {
  channel: { id: string; name: string };
  user: { id?: string; name?: string };
  text: string;
  ts: string;
  autoIndexed?: boolean;
};

/**
 * Constructs the database document for a message.
 */
export async function messageToDocument(
  message: Message
): Promise<Document<Record<string, any>>> {
  const timestamp = new Date(Number(message.ts) * 1000).toISOString();

  const link = await slack.client.chat.getPermalink({
    message_ts: message.ts,
    channel: message.channel.id,
  });

  let title = message.text!.split("\n")[0].trim();
  if (title.length > 30) {
    title = title.substring(0, 30).trim() + "...";
  }
  title = title
    .replaceAll("<!here>", "@here")
    .replaceAll("<!channel>", "@channel");
  title = `#${message.channel.name} - ${title}`;

  const header = `---
  Type: Slack Message
  Channel: ${message.channel.name}
  Author: ${message.user.name ?? ""}
  Timestamp: ${timestamp}
  ---`;

  return new Document({
    pageContent: header + "\n" + message.text!,
    metadata: {
      type: "slack.message",
      message_ts: message.ts,
      channel: message.channel,
      user: message.user,
      link: link.permalink,
      title: title,
      slackAutoIndexed: message.autoIndexed ?? false,
    },
  });
}
