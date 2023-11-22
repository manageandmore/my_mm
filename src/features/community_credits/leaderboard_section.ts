import { AnyHomeTabBlock } from "slack-edge";
import { CreditsLeaderboardItem } from "./query_leaderboard";

export function getCreditsLeaderboardSection(
  leaderboard: CreditsLeaderboardItem[]
): AnyHomeTabBlock[] {
  return [
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
          text: `${leaderboard[0].name}`,
        },
        {
          type: "mrkdwn",
          text: `${leaderboard[0].credits}`,
        },
        {
          type: "mrkdwn",
          text: `${leaderboard[1].name}`,
        },
        {
          type: "mrkdwn",
          text: `${leaderboard[1].credits}`,
        },
        {
          type: "mrkdwn",
          text: `${leaderboard[2].name}`,
        },
        {
          type: "mrkdwn",
          text: `${leaderboard[2].credits}`,
        },
      ],
    },
  ];
}
