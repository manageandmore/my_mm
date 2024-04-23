import { AnyHomeTabBlock, StarRemovedEvent } from "slack-edge";
import { CreditsLeaderboardItem } from "./query_leaderboard";

export function getCreditsLeaderboardSection(
  leaderboard: CreditsLeaderboardItem[], userName: string, rank: number, userCredits: number
): AnyHomeTabBlock[] {

  let rows: [number | null, string, number][] = [];

  for (let i = 0; i < 3; i++) {
    if (i >= leaderboard.length) break;
    rows.push([i+1, leaderboard[i].name, leaderboard[i].credits]);
  }
  if (rank > 4) {
    rows.push([null, '...', 0]);
  }
  if (rank > 3) {
    rows.push([rank, userName, userCredits]);
  }

  let table = rows.map(([r, n, c]) => {
    var str = `${r != null ? `${r}.    |     ${c > 9 ? '' : ' '}${c}${c > 9 ? '' : ' '}   ` : '        |     ...    '} |  ${n}`;
    if (n == userName) str = `*${str}*`;
    return str;
  }).join('\n');

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
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "Leaderboard of community credits across all scholars. Can you make it to the top three?"
      }]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "_ ⭐️ | Credits | Name_\n" + table
      },
    },
  ];
}
