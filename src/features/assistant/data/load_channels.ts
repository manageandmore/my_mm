import { getVectorStore } from "../ai/chain";
import { slack } from "../../../slack";
import { ONE_DAY } from "../../common/time_utils";
import { getMessageDocumentId, messageToDocument } from "./message_loader";
import { Channel } from "slack-web-api-client/dist/client/generated-response/ConversationsListResponse";
import { User, getUserById } from "../../common/id_utils";

export type SyncChannelInfo = {
  channel: string;
  messages: number;
};

export async function loadSlackChannels(
  targetChannels: string[],
  botUserId: string,
  report?: (info: SyncChannelInfo) => Promise<void>
) {
  try {
    const vectorStore = await getVectorStore();
    const channels = await getPublicChannels();

    const users = new Map<string, User>();

    for (let [channelId, channel] of channels) {
      if (!targetChannels.includes(channel.name ?? "*")) {
        continue;
      }

      console.log("SYNCING CHANNEL", channel.name);

      let hasMore = true;
      let currentCursor: string | undefined = undefined;

      let messagesAdded = 0;

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
          if (message.subtype == "bot_message") {
            continue;
          }

          if (message.text!.includes(`<@${botUserId}>`)) {
            continue;
          }

          var documentId = await getMessageDocumentId(channelId, message.ts!);

          var user =
            users.get(message.user ?? "") ??
            (await getUserById(message.user ?? ""));

          var document = await messageToDocument({
            text: message.text!,
            ts: message.ts!,
            channel: { id: channelId, name: channel.name! },
            user: { id: message.user, name: user?.real_name ?? user?.name },
            autoIndexed: true,
          });

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
