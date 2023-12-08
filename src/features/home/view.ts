import { AnyHomeTabBlock, Button, HomeTabView } from "slack-edge";
import { CreditsLeaderboardItem } from "../community_credits/query_leaderboard";
import { getOpenWishlistButton } from "../wishlist/views/open_wishlist_button";
import { getSkillsSection } from "../skill_interface/views/skills_section";
import { getProfileSection } from "../profile/profile_section";
import { getCreditsLeaderboardSection } from "../community_credits/leaderboard_section";
import { SkillListPerLevel } from "../skill_interface/data/query_skills";
import { scholarsDatabaseId } from "../common/id_utils";
import { getAskAIButton } from "../assistant/events/ask_ai_action";
import { getCreatePostButton } from "../post_creator/actions/create_post_action";

/** Interface for the data used to hydrate the home view. */
export interface HomeOptions {
  name: string;
  status: string;
  generation: string;
  ip: string;
  ep: string;
  communityCredits: number;
  rank: number;
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
export async function getHomeView(
  userId: string,
  options: HomeOptions
): Promise<HomeTabView> {
  return {
    type: "home",
    blocks: [
      ...getProfileSection(options),
      ...getSkillsSection(options.skillList),
      ...getCreditsLeaderboardSection(
        options.creditsLeaderboard,
        options.name,
        options.rank,
        options.communityCredits
      ),
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          await getAskAIButton(userId),
          await getCreatePostButton(userId),
          getOpenWishlistButton(),
        ].filter((b): b is Button => b != null),
      },
      {
        type: "divider",
      },
      ...getHomeFooter(),
    ],
  };
}

function getHomeFooter(): AnyHomeTabBlock[] {
  return [
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
          text: "<https://github.com/manageandmore/my_mm|See the code>",
        },
        {
          type: "mrkdwn",
          text: "<https://github.com/manageandmore/my_mm/issues|Report an issue>",
        },
      ],
    },
  ];
}

export function getHomeErrorView(errorMsg: string): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚫 Sorry, there was an error.",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text:
              "We're sorry but something went wrong while loading your profile. " +
              "Maybe your profile wasn't added to the scholar notion database yet. " +
              `You can find it <https://www.notion.so/${scholarsDatabaseId}|here>. If so please contact Program Management.`,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "The specific error is:",
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `_${errorMsg}_`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text:
              "If you can't identify the problem, report this to your IP Digital by clicking the following link: " +
              `<https://github.com/manageandmore/my_mm/issues/new?label=bug&title=Home%20screen%20error&body=${encodeURIComponent(
                errorMsg
              )}|Report error>.`,
          },
        ],
      },
      {
        type: "divider",
      },
      ...getHomeFooter(),
    ],
  };
}
