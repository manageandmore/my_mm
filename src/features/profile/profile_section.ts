import { AnyHomeTabBlock } from "slack-edge";
import { ScholarProfile } from "./query";

/** Interface for the data used to hydrate the profile section. */
export type ProfileOptions = ScholarProfile & {
  rank: number;
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
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "Your profile information at a glance. Backed by our central notion database of all scholars."
      }, {
        type: "mrkdwn",
        text: `<${options.url}|View in Notion>`
      }]
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
      ],
      
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*📒 Area* · ${options.ip}`,
        },
        {
          type: "mrkdwn",
          text: `*🚀 Innovation Project* · ${options.ep}`,
        },
      ],
      
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*⭐️ Community Credits* · ${options.credits}/6`,
        },
        {
          type: "mrkdwn",
          text: `*🥇 Rank* · ${options.rank}`,
        },
      ],
    },
  ];
}
