import { AnyHomeTabBlock } from "slack-edge";

/** Interface for the data used to hydrate the profile section. */
export interface ProfileOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  rank: number;
  url?: string;
}

export function getProfileSection(options: ProfileOptions): AnyHomeTabBlock[] {
  let rank_medal = "🎖️";
  if (options.rank == 1) {
    rank_medal = "🥇";
  } else if (options.rank == 2) {
    rank_medal = "🥈";
  } else if (options.rank == 3) {
    rank_medal = "🥉";
  }

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
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Your profile information at a glance. Backed by our central notion database of all scholars.",
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*⏳ Generation* · G${options.generation}`,
        },
        {
          type: "mrkdwn",
          text: `*👤 Status* · ${options.status}`,
        },
        {
          type: "mrkdwn",
          text: `*📒 Area* · ${options.ip}`,
        },
        {
          type: "mrkdwn",
          text: `*🚀 Innovation Project* · ${options.ep}`,
        },
        {
          type: "mrkdwn",
          text: `*⭐️ Community Credits* · ${options.communityCredits}/6`,
        },
        {
          type: "mrkdwn",
          text: `*${rank_medal} Rank* · ${options.rank}`,
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
