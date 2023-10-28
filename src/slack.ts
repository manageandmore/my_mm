import { SlackApp } from "slack-edge";
import { slackSigningSecret, slackToken } from "./constants";

/**
 * The api client used to access the slack api and handle events.
 */
export const slack = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackToken,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

export const scholarIdField = 'Xf063XD67XC0'