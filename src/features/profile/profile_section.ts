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
          text:
            `*⏳ Generation* · ${options.generation}\n` +
            `*📒 Internal Project* · ${options.ip}\n` +
            `*🚀 External Project* · ${options.ep}`,
        },
        {
          type: "mrkdwn",
          text:
            `*👤 Status* · ${options.status}\n` +
            `*⭐️ Community Credits* · ${options.communityCredits}/6\n` +
            "*🏆 Liga* · Credit Warrior",
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
