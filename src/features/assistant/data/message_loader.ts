import { Document } from "langchain/dist/document";
import { slack } from "../../../slack";

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
