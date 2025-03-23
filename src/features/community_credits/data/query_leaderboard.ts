import { notion } from "../../../notion";
import { scholarsDatabaseId } from "../../common/id_utils";
import { ScholarRow } from "../../home/data/query_profile";

/** Interface for one Item of Credits Leaderboard */
export interface CreditsLeaderboardItem {
  name: string;
  credits: number;
}

/** function queries notion for the top 3 entries of the credit leaderboard */
export async function queryCreditsLeaderboard(
  scholarId: string
): Promise<[CreditsLeaderboardItem[], number]> {
  try {
    const response = await notion.databases.query({
      database_id: scholarsDatabaseId,
      filter: {
        property: "Status",
        select: {
          equals: "Active",
        },
      },
      sorts: [
        {
          property: "Community Credits",
          direction: "descending",
        },
      ],
    });

    /** find the index of the scholar in the leaderboard
     * if the scholar is not in the leaderboard, return the rank as 100*/
    let rank = 100;
    let top3Scholars: CreditsLeaderboardItem[] = [];
    let scholars = response.results as ScholarRow[];

    for (let i = 0; i < scholars.length; i++) {
      if (i < 3) {
        top3Scholars.push({
          name: `${scholars[i].properties.Name.title[0].plain_text} (G${scholars[i].properties.Generation.number})`,
          credits:
            scholars[i].properties["Community Credits"].rollup.number ?? 0,
        });
      }
      if (response.results[i].id === scholarId) {
        rank = i + 1;
      }
      if (i >= 3 && rank < 100) {
        break;
      }
    }
    return [top3Scholars, rank];
  } catch (e) {
    console.error("Error fetching credits leaderboard", e);
    return [[], 100];
  }
}
