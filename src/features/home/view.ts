import { HomeTabView } from "slack-edge";
import { CreditsLeaderboardItem } from "../community_credits/query_leaderboard";
import { SkillItem } from "../skill_interface/data/query_skills";
import { getWishlistActionSection } from "../wishlist/views/action_section";
import { getSkillsSection } from "../skill_interface/views/skills_section";
import { getProfileSection } from "../profile/profile_section";
import { getCreditsLeaderboardSection } from "../community_credits/leaderboard_section";

/** Interface for the data used to hydrate the home view. */
export interface HomeOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  url?: string;
  skills: string[];
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
