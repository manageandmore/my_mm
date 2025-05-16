import { AnyHomeTabBlock, Button, HomeTabView } from "slack-edge";
import { CreditsLeaderboardItem } from "../../community_credits/data/query_leaderboard";
import { getIdeaFactorySection } from "../../idea_factory/views/open_idea_factory_button";
import { getJobBoardSection } from "../../job_board/views/open_job_board_button";
import { getSkillsSection } from "../../skill_interface/views/skills_section";
import { getCreditsLeaderboardSection } from "../../community_credits/views/leaderboard_section";
import { SkillListPerLevel } from "../../skill_interface/data/query_skills";
import { scholarsDatabaseId } from "../../common/id_utils";
import { getAskAIButton } from "../../assistant/events/ask_ai_action";
import { getCreatePostButton } from "../../post_creator/actions/create_post_action";
import { getAdminSection } from "../admin";
import { ProfileOptions, getProfileSection } from "./profile_section";
import { getInboxSection, getOutboxSection } from "../../inbox/views/inbox_section";
import { ReceivedInboxEntry } from "../../inbox/data";
import { getHelpSection } from "./help_section";

/** Interface for the data used to hydrate the home view. */
export type HomeOptions = ProfileOptions & {
  creditsLeaderboard: CreditsLeaderboardItem[];
  skillList: SkillListPerLevel;
  inbox: ReceivedInboxEntry[];
  hasOutbox: boolean;
};

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
      {
        type: "divider",
      },
      ...getIdeaFactorySection(),
      {
        type: "divider",
      },
      ...getInboxSection(options.inbox),
      ...(options.hasOutbox ? getOutboxSection() : []),
      {
        type: "divider",
      },
      ...getCreditsLeaderboardSection(
        options.creditsLeaderboard,
        options.name,
        options.rank,
        options.credits
      ),
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          await getAskAIButton(userId),
          await getCreatePostButton(userId),
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "💵 Reimbursement Form",
            },
            url: "https://www.notion.so/manageandmore/Reimbursement-under-development-1e5023f3b8364bd3a50c6066944bc958?pvs=4",
          },
        ].filter((b): b is Button => b != null),
      },
      {
        type: "divider",
      },
      ...getHelpSection(),
      {
        type: "divider",
      },
      ...(await getAdminSection(userId)),

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
          text: "Made with ❤️ and 🍕 by your *Area Digital Innovation*",
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
              "If you can't identify the problem, report this to your Area Digital Innovation by messaging us on slack!",
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
