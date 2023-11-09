import { notion } from "../../notion";
import { scholarsDatabaseId } from "../common/id_utils";
import { ScholarRow } from "../profile/query";

/** Interface for one Item of Credits Leaderboard */
export interface CreditsLeaderboardItem {
  name: string;
  credits: number;
}

/** function queries notion for the top 3 entries of the credit leaderboard */
export async function queryCreditsLeaderboard(): Promise<
  CreditsLeaderboardItem[]
> {
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
      page_size: 3,
    });

    return (response.results as ScholarRow[]).map((result) => {
      const props = result.properties;

      return {
        name: props.Name.title[0].plain_text,
        credits: props["Community Credits"].rollup.number ?? 0,
      };
    });
  } catch (e) {
    console.error("Error fetching credits leaderboard", e);
    return [];
  }
}
