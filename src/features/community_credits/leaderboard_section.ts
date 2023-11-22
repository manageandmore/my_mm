import { AnyHomeTabBlock, StarRemovedEvent } from "slack-edge";
import { CreditsLeaderboardItem } from "./query_leaderboard";

export function getCreditsLeaderboardSection(
  leaderboard: CreditsLeaderboardItem[], userName: string, rank: number, userCredits: number
): AnyHomeTabBlock[] {
  let leaderboardNameList = "";
  let leaderboardCreditsList = "";

  for (let i = 0; i < 3; i++) {
    if (leaderboard[i].name === userName) {
      leaderboardNameList += `*${i+1}. ${leaderboard[i].name}*`;
      leaderboardCreditsList += `*${userCredits}*`;
    } else {
      leaderboardNameList += `${i+1}. ${leaderboard[i].name}`;
      leaderboardCreditsList += `${leaderboard[i].credits}`;
    }
    leaderboardNameList += `\n`;
    leaderboardCreditsList += `\n`;
  }
  if (rank > 3) {
    if (rank > 4) {
      leaderboardNameList += `...\n`;
      leaderboardCreditsList += `...\n`;
    }
    leaderboardNameList += `*${rank}. ${userName}*`;
    leaderboardCreditsList += `*${userCredits}*`;
  }
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
          text: leaderboardNameList,
        },
        {
          type: "mrkdwn",
          text: leaderboardCreditsList,
        },
      ],
    },
  ];
}
