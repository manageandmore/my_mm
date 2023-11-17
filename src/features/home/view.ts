import { HomeTabView } from "slack-edge";
import { CreditsLeaderboardItem } from "../community_credits/query_leaderboard";
import { getWishlistActionSection } from "../wishlist/views/action_section";
import { getSkillsSection } from "../skill_interface/views/skills_section";
import { getProfileSection } from "../profile/profile_section";
import { getCreditsLeaderboardSection } from "../community_credits/leaderboard_section";
import { SkillListPerLevel } from "../skill_interface/data/query_skills";

/** Interface for the data used to hydrate the home view. */
export interface HomeOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  url?: string;
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
      ...getProfileSection(options),
      ...getSkillsSection(options.skillList),
      ...getCreditsLeaderboardSection(options.creditsLeaderboard),
      {
        type: "divider",
      },
      getWishlistActionSection(),
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Made with ❤️ and 🍕 by your *IP Digital*",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "<https://github.com/schultek/mm_app|See the code>",
          },
          {
            type: "mrkdwn",
            text: "<https://github.com/schultek/mm_app/issues|Report an issue>",
          },
        ],
      },
    ],
  };
}

export function getHomeErrorView(errorMsg :string): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "We're sorry but something went wrong while loading your profile. Maybe your profile wasn't added to the scholar notion database yet. You can find it <https://www.notion.so/manageandmore/258576df97e347fa89b0ab2b237d3118?v=9af3d7c905bd48ce8ed96466e5027e9c|here>. If so please contact Program Management.",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "The specific error is:\n _" + errorMsg + "_ \nReport this to your IP Digital if you can't identify the problem.",
        },
      },
    ],
  };
}
