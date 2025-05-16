import { notionEnv } from "../../../constants";
import { DatabaseRow, notion, Property, RollupProperty } from "../../../notion";
import { timeSince } from "../../common/time_utils";
import { getVoterByScholarId, Voter } from "./get_voter";

/** The id of the idea_factory database in notion. */
export const ideaFactoryDatabaseId =
  notionEnv == "production"
    ? "96cd6950e18544318f98ee86a1886deb"
    : "19164f4c334080cf8920f8ebacc94599";

/**
 * Type definition for a row in the Idea Factory database.
 */
type IdeaRow = DatabaseRow<{
  Title: Property<"title">;
  Status: Property<"status">;
  "Reason Final Decision": Property<"rich_text">;
  Pitch: Property<"rich_text">;
  "Initiated by": Property<"people">;
  Description: Property<"rich_text">;
  Votes: RollupProperty<"number">;
  Voted: Property<"relation">;
  "Responsible Person": Property<"people">;
  Created: Property<"created_time">;
  Category: Property<"select">;
}>;

/**
 * Interface for an idea.
 */
export interface IdeaFactoryItem {
  id: string;
  title: string;
  pitch: string;
  voters: Voter[];
  votedByUser: boolean;
  timeSinceCreated: string;
}

/**
 * Queries all items from the idea factory database sorted by votes and creation time.
 * For each item it additionally retrieves the list of voters including name and profile image.
 *
 * @param currentUserId The id of the current user.
 * @returns A list of idea factory items.
 */
export async function queryIdeaFactoryItems(
  currentUserId: string
): Promise<IdeaFactoryItem[]> {
  // Execute both queries in parallel
  const [recentResponse, topVotedResponse] = await Promise.all([
    // Fetch recent ideas (last 15)
    notion.databases.query({
      database_id: ideaFactoryDatabaseId,
      filter: {
        type: "status",
        property: "Status",
        status: {
          equals: "New",
        },
      },
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      page_size: 15,
    }),
    // Fetch top voted ideas (top 10)
    notion.databases.query({
      database_id: ideaFactoryDatabaseId,
      filter: {
        type: "status",
        property: "Status",
        status: {
          equals: "New",
        },
      },
      sorts: [
        {
          property: "Votes",
          direction: "descending",
        },
      ],
      page_size: 10,
    }),
  ]);

  // Combine and deduplicate results
  const allRows = [...topVotedResponse.results, ...recentResponse.results];
  const uniqueRows = Array.from(
    new Map(allRows.map((row) => [row.id, row])).values()
  ) as IdeaRow[];

  // Collect all unique voter IDs first
  const uniqueVoterIds = new Set<string>();
  for (const row of uniqueRows) {
    for (const voted of row.properties.Voted.relation) {
      uniqueVoterIds.add(voted.id);
    }
  }

  // Fetch all voters in parallel
  const voterPromises = Array.from(uniqueVoterIds).map((scholarId) =>
    getVoterByScholarId(scholarId)
  );
  const voters = await Promise.all(voterPromises);
  
  // Create a map for quick voter lookup
  const voterMap = new Map(voters.map((voter) => [voter.scholarId, voter]));

  // Process ideas with the cached voter information
  const items: IdeaFactoryItem[] = uniqueRows.map((row) => {
    const voters: Voter[] = [];
    let votedByUser = false;

    for (const voted of row.properties.Voted.relation) {
      const voter = voterMap.get(voted.id);
      if (voter) {
        voters.push(voter);
        if (voter.userId === currentUserId) {
          votedByUser = true;
        }
      }
    }

    return {
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      pitch: row.properties.Pitch.rich_text[0]?.plain_text ?? "",
      voters,
      votedByUser,
      timeSinceCreated: timeSince(row.created_time),
    };
  });

  return items;
}
