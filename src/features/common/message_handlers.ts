import { MessageEventHandler, SlackAppEnv } from "slack-edge";
import { slack } from "../../slack";

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
