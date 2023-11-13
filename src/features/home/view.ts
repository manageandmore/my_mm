import { HomeTabView } from "slack-edge";
import { openWishlistAction } from "../wishlist/events/open_wishlist";
import { CreditsLeaderboardItem } from "../community_credits/query_leaderboard";
import { SkillListPerLevel } from "../skill_interface/data/query_skills";
import { editSkillItemsAction } from "../skill_interface/events/edit_skills";

/** Interface for the data used to hydrate the home view. */
export interface HomeOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  creditsLeaderboard: CreditsLeaderboardItem[];
  skillList: SkillListPerLevel;
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
        ],
        accessory: {
          type: "image",
          image_url:
            "https://www.befunky.com/images/wp/wp-2013-08-featured1.png?auto=avif,webp&format=jpg&width=500&crop=16:9",
          alt_text: "calendar thumbnail",
        },
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Skills",
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
            text: `*Expert:*\n${options.skillList.expert.join(", ")}`,
          },
          {
            type: "mrkdwn",
            text: `*Intermediate:*\n${options.skillList.intermediate.join(
              ", "
            )}`,
          },
          {
            type: "mrkdwn",
            text: `*Beginner:*\n${options.skillList.beginner.join(", ")}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Edit Skills",
            },
            action_id: editSkillItemsAction,
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
