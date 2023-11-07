import { Document } from "langchain/dist/document";
import { slack } from "../../../slack";
import { getVectorStore } from "../ai/chain";
import { getUserById } from "../../common/id_utils";
import { SlackAPIError } from "slack-edge";

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

  const documentId = await toUUID(
    payload.channel.id + ":" + payload.message_ts
  );

  const user = await getUserById(payload.message.user ?? "");
  const timestamp = new Date(Number(payload.message_ts) * 1000).toISOString();

  const link = await slack.client.chat.getPermalink({
    message_ts: payload.message_ts,
    channel: payload.channel.id,
  });

  let title = payload.message.text!.split("\n")[0].trim();
  if (title.length > 30) {
    title = title.substring(0, 30).trim() + "...";
  }
  title = title
    .replaceAll("<!here>", "@here")
    .replaceAll("<!channel>", "@channel");
  title = `#${payload.channel.name} - ${title}`;

  const vectorStore = await getVectorStore();
  await vectorStore.delete({ ids: [documentId] });

  const header = `---
  Type: Slack Message
  Channel: ${payload.channel.name}
  Author: ${user?.real_name ?? user?.name ?? "Unknown"}
  Timestamp: ${timestamp}
  ---`;

  const document = new Document({
    pageContent: header + "\n" + payload.message.text!,
    metadata: {
      type: "slack.message",
      message_ts: payload.message_ts,
      channel: payload.channel,
      user: payload.message.user,
      link: link.permalink,
      title: title,
    },
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

async function toUUID(id: string): Promise<string> {
  let digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(id)
  );
  let hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(
    12,
    16
  )}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}
