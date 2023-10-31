import { AnyBlockElement, AnyMessageBlock, AnyTextField, MessageAttachment } from "slack-edge";
import { slack } from "../../slack";
import { run } from "../assistant/assistant";

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 * 
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
slack.event("app_mention", async (request) => {
  const event = request.payload

  const message = event.text

  const msg = await slack.client.chat.postMessage({
    channel: event.channel,
    text: '... (🧠 Initiating brain waves)',
  });

  const results = await run(message)
  let blocks: AnyMessageBlock[] = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: results.text,
      }
    }
  ]

  if (results.sourceDocuments != null) {
    const sourceIds: string[] = []
    const elements: AnyTextField[] = []

    for (var doc of results.sourceDocuments) {
      if (sourceIds.includes(doc.metadata.notionId)) continue;
      
      const props = doc.metadata.properties
      const icon = doc.metadata.icon

      const title = `${icon != null ? icon.emoji + ' ' : ''}${props?._title ?? props.title}`
      const url = `https://www.notion.so/${doc.metadata.notionId.replaceAll('-', '')}`

      sourceIds.push(doc.metadata.notionId)
      elements.push(
        {
          type: "mrkdwn",
          text: `<${url}|${title}>`
        }
      )
    }

    blocks.push({
      type: "context",
      elements: elements
    })
  }

  await slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: results.text,
    blocks: blocks,
  })
});
