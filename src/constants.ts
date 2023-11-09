/** The bot api token used to authenticate with the slack api. */
export const slackBotToken = process.env.SLACK_BOT_TOKEN!;
/** The user api token used to authenticate with the slack api. */
export const slackUserToken = process.env.SLACK_USER_TOKEN!;
/** The signing key used to validate the signature of incoming slack events. */
export const slackSigningSecret = process.env.SLACK_SIGNING_SECRET!;

/** The api token used to authenticate with the notion api. */
export const notionToken = process.env.NOTION_INTEGRATION_TOKEN;

/** The api token used to authenticate with the openai api. */
export const openaiToken = process.env.OPENAI_TOKEN;

/** The current url of the hosted api. */
export const currentUrl = process.env.VERCEL_URL;
