import { AnyBlockElement, AnyMessageBlock, MessageAttachment } from "slack-edge";
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

  if (results.sourceDocuments != null && results.sourceDocuments.length > 0) {
    const doc = results.sourceDocuments[0]

    const title = `${doc.metadata.icon != null ? doc.metadata.icon.emoji + ' ' : ''}${doc.metadata.properties._title}`
    const url = `https://www.notion.so/${doc.metadata.notionId.replaceAll('-', '')}`

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Source:"
        },
        {
          type: "mrkdwn",
          text: `<${url}|${title}>`
        }
      ]
    })

    blocks.push({
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: doc.pageContent.substring(0, 100)+ '...',
        }
      ]
    })
  }

  await slack.client.chat.update({
    channel: msg.channel!,
    ts: msg.ts!,
    text: results.text,
    blocks: blocks,
  })
});
