import { MessageEventHandler, SlackApp, SlackAppEnv } from "slack-edge";
import { slackSigningSecret, slackBotToken } from "./constants";

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
