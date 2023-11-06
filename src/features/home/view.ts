import { HomeTabView } from "slack-edge";
import { openWishlistAction } from "../wishlist/actions/open_wishlist";

/** Interface for one Item of Credits Leaderboard */
export interface CreditsLeaderboardItem {
  name: string;
  credits: number;
}

/** Interface for the data used to hydrate the home view. */
export interface HomeOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  skills: string[];
  creditsLeaderboard: CreditsLeaderboardItem[];
}

/**
 * Constructs the home view with the current user data.
 *
 * @param options The user data needed to fill out the view.
 * @returns The home view as a set of structured blocks.
 */
export function getHomeView(options: HomeOptions): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: options.name,
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
            text: `*👤 Status :*\n${options.status}\n`,
          },
          {
            type: "mrkdwn",
            text: `*⏳ Generation:*\n${options.generation}`,
          },
          {
            type: "mrkdwn",
            text: `*📒 Internal Project:*\n${options.ip}`,
          },
          {
            type: "mrkdwn",
            text: `*🚀 External Project:*\n${options.ep}`,
          },
          {
            type: "mrkdwn",
            text: `*⭐️ Community Credits:*\n${options.communityCredits}/6`,
          },
          {
            type: "mrkdwn",
            text: "*🏆 Liga:*\n Credit Warrior",
          },
          {
            type: "mrkdwn",
            text: "*🕶️ Skills:*",
          },
        ],
        accessory: {
          type: "image",
          image_url:
            "https://www.befunky.com/images/wp/wp-2013-08-featured1.png?auto=avif,webp&format=jpg&width=500&crop=16:9",
          alt_text: "calendar thumbnail",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Barking",
              emoji: true,
            },
            value: "barking",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Sleeping",
              emoji: true,
            },
            value: "sleep",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Being cute",
              emoji: true,
            },
            value: "cute",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Doing Nothing",
              emoji: true,
            },
            value: "nothing",
          },
        ],
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Community Credits Leaderboard",
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
            text: "👑 *Name*",
          },
          {
            type: "mrkdwn",
            text: "⭐️ *Credits*",
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[0].name}`,
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[0].credits}`,
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[1].name}`,
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[1].credits}`,
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[2].name}`,
          },
          {
            type: "mrkdwn",
            text: `${options.creditsLeaderboard[2].credits}`,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🎁 Open Wishlist",
              emoji: true,
            },
            action_id: openWishlistAction,
          },
        ],
      },
    ],
  };
}
