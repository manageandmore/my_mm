import { anyMessage, getPublicChannels, slack } from "../../../slack";
import { getVectorStore } from "../ai/chain";
import { getUserById } from "../../common/id_utils";
import { ButtonAction } from "slack-edge";
import { features } from "../../common/feature_flags";
import { assistantFeatureFlag } from "..";
import { getMessageDocumentId, messageToDocument } from "../loaders/load_channels";

anyMessage(async (request) => {
  const payload = request.payload;

  if (payload.subtype == "bot_message") {
    return;
  }

  if (payload.text.includes(`<@${request.context.botUserId}>`)) {
    return;
  }

  const channels = await getPublicChannels();
  const channelName = channels.get(payload.channel)?.name;

  if (channelName == null) {
    return;
  }

  const indexedChannels = await features.read(assistantFeatureFlag).tags
    .IndexedChannels;

  const isIndexed =
    indexedChannels != false &&
    indexedChannels.split(";").includes(channelName);

  if (!isIndexed) {
    return;
  }

  const vectorStore = await getVectorStore();

  const documentId = await getMessageDocumentId(payload.channel, payload.ts);

  const user = await getUserById(payload.user ?? "");
  const document = await messageToDocument({
    channel: { id: payload.channel, name: channelName },
    user: {
      id: payload.user,
      name: user?.real_name ?? user?.name,
    },
    text: payload.text,
    ts: payload.ts,
    autoIndexed: true,
  });

  await vectorStore.addDocuments([document], { ids: [documentId] });
});

const addToAssistantShortcut = "add_to_assistant";

slack.messageShortcut(addToAssistantShortcut, async (request) => {
  const payload = request.payload;

  try {
    const response = await slack.client.conversations.info({
      channel: payload.channel.id,
    });

    const channel = response.channel!;
    if (!channel.is_channel || channel.is_archived || channel.is_private) {
      throw new Error("Unallowed channel");
    }

    if (!channel.is_member) {
      await request.context.respond({
        response_type: "ephemeral",
        text: "❕ Please add me to this channel first, otherwise I cannot read the message.",
      });
      return;
    }
  } catch (_) {
    await request.context.respond({
      response_type: "ephemeral",
      text: "❌ Sorry, only messages posted in public channels can be added to my knowledge index in order to protect private conversations.",
    });
  }

  const vectorStore = await getVectorStore();

  const documentId = await getMessageDocumentId(
    payload.channel.id,
    payload.message_ts
  );
  const query = await vectorStore.client.query(
    `SELECT ${vectorStore.idColumnName} FROM ${vectorStore.tableName} WHERE ${vectorStore.idColumnName} = $1`,
    [documentId]
  );

  if (query.rowCount > 0) {
    await slack.client.chat.postEphemeral({
      channel: payload.channel.id,
      user: payload.user.id,
      text: "🧠 This message is already part of my knowledge index. If you want, I can remove it again.",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🧠 This message is already part of my knowledge index. If you want, I can remove it again.",
          },
          accessory: {
            type: "button",
            action_id: removeFromAssistantAction,
            text: {
              type: "plain_text",
              text: `Remove from assistant`,
              emoji: true,
            },
            style: "primary",
            value: JSON.stringify({
              documentId,
              messageTs: payload.message_ts,
            }),
          },
        },
      ],
    });

    return;
  }

  await vectorStore.delete({ ids: [documentId] });

  const user = await getUserById(payload.message.user ?? "");
  const document = await messageToDocument({
    channel: payload.channel,
    user: {
      id: payload.message.user,
      name: user?.real_name ?? user?.name,
    },
    text: payload.message.text!,
    ts: payload.message_ts,
  });

  await vectorStore.addDocuments([document], { ids: [documentId] });

  try {
    await slack.client.reactions.add({
      channel: payload.channel.id,
      timestamp: payload.message_ts,
      name: "brain",
    });
  } catch (e) {
    console.log("ERROR", e);
  }

  await slack.client.chat.postEphemeral({
    channel: payload.channel.id,
    user: payload.user.id,
    text: "🧠 I successfully added the message to my knowledge index. 🙏 Thanks for helping me grow my knowledge to better assist the community.",
  });
});

const removeFromAssistantAction = "remove_from_assistant";

slack.action(removeFromAssistantAction, async (request) => {
  const payload = request.payload;
  const action = payload.actions[0] as ButtonAction;

  const { documentId, messageTs } = JSON.parse(action.value);

  const vectorStore = await getVectorStore();
  await vectorStore.delete({ ids: [documentId] });

  await slack.client.reactions.remove({
    channel: payload.channel!.id,
    timestamp: messageTs,
    name: "brain",
  });

  await slack.client.chat.postEphemeral({
    channel: payload.channel!.id,
    user: payload.user.id,
    text: "🧠 I successfully removed the message from my knowledge index.",
  });
});
