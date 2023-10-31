import { SlackApp } from "slack-edge";
import { slackSigningSecret, slackBotToken, slackUserToken } from "./constants";

/**
 * The api client used to access the slack api and handle events.
 */
export const slack = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackBotToken,
    SLACK_APP_TOKEN: slackUserToken,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

export const scholarIdField = 'Xf063XD67XC0'