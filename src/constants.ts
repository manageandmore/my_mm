/** The bot api token used to authenticate with the slack api. */
export const slackBotToken = process.env.SLACK_BOT_TOKEN!;
/** The signing key used to validate the signature of incoming slack events. */
export const slackSigningSecret = process.env.SLACK_SIGNING_SECRET!;

/** The api token used to authenticate with the notion api. */
export const notionToken = process.env.NOTION_INTEGRATION_TOKEN;
/** The notion environment to use, either "production" or anything else. */
export const notionEnv = process.env.NOTION_ENV;

/** The api token used to authenticate with the openai api. */
export const openaiToken = process.env.OPENAI_TOKEN;

/** The current url of the hosted api. */
export const currentUrl = process.env.VERCEL_URL;

/** Prefix for all cache keys. Used to avoid clashes between environments. */
export const cachePrefix = process.env.CACHE_PREFIX;

/** List of automatically indexed channels for the AI assistant. */
export const indexedChannels = ["general", "active"];

/** Bot will ask senders in these channels if they want to add the sent
 * message to all recipients' inboxes */
export const inboxableChannels = ["general", "active"];

/** Bot will ask senders in these channels of they want to add their job offer
 * to the job board on the MyMM homepage - CURRENTLY DISABLED */
//export const jobOfferChannels = ["careerboost"];
export const jobOfferChannels = [];
