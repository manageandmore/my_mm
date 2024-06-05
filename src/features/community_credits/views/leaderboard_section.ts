import { AnyHomeTabBlock } from "slack-edge";
import { CreditsLeaderboardItem } from "../data/query_leaderboard";

/**
 * Constructs the leaderboard section based on the list of leaderboard items and the users own credits.
 */
export function getCreditsLeaderboardSection(
  leaderboard: CreditsLeaderboardItem[], userName: string, rank: number, userCredits: number
): AnyHomeTabBlock[] {

  // The leaderboard rows as [rank, name, credits count]
  let rows: [number | null, string, number][] = [];

  // Show the top three entries.
  for (let i = 0; i < 3; i++) {
    if (i >= leaderboard.length) break;
    rows.push([i+1, leaderboard[i].name, leaderboard[i].credits]);
  }
  // Show a divider row.
  if (rank > 4) {
    rows.push([null, '...', 0]);
  }
  // Show the users entry.
  if (rank > 3) {
    rows.push([rank, userName, userCredits]);
  }

  // Formats the table as pure text. 
  // This checks each column for the max. width and inserts whitespaces as needed.
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
