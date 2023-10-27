import { openai, systemMessage } from "../../openai";
import { slack } from "../../slack";

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 * 
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
 slack.event("app_mention", async (request) => {
  const event = request.payload;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 200,
    messages: [systemMessage, { role: "user", content: event.text }],
  });

  await slack.client.chat.postMessage({
    channel: event.channel,
    text: response.choices[0].message.content!,
  });
});
