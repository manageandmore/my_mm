import { AnyHomeTabBlock } from "slack-edge";

/** Interface for the data used to hydrate the profile section. */
export interface ProfileOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  url?: string;
}

export function getProfileSection(options: ProfileOptions): AnyHomeTabBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${options.name}`,
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*⏳ Generation* · ${options.generation}`,
        },
        {
          type: "mrkdwn",
          text: `*👤 Status* · ${options.status}`,
        },
        {
          type: "mrkdwn",
          text: `*📒 Internal Project* · ${options.ip}`,
        },
        {
          type: "mrkdwn",
          text: `*⭐️ Community Credits* · ${options.communityCredits}/6`,
        },
        {
          type: "mrkdwn",
          text: `*🚀 External Project* · ${options.ep}`,
        },
        {
          type: "mrkdwn",
          text: "*🏆 Liga* · Credit Warrior",
        },
      ],
      accessory:
        options.url != null
          ? {
              type: "overflow",
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "View in Notion",
                  },
                  url: options.url,
                },
              ],
            }
          : undefined,
    },
  ];
}
