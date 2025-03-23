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
  const response = await notion.databases.query({
    database_id: ideaFactoryDatabaseId,
    sorts: [
      {
        property: "Votes",
        direction: "descending",
      },
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });

  let items: IdeaFactoryItem[] = [];

  // Keep track of voters across different items, to not fetch a voter twice.
  let allVoters: Record<string, Voter> = {};

  for (let row of response.results as IdeaRow[]) {
    let voters: Voter[] = [];
    let votedByUser = false;

    for (const voted of row.properties.Voted.relation) {
      const scholarId = voted.id;

      if (allVoters[scholarId] == null) {
        allVoters[scholarId] = await getVoterByScholarId(scholarId);
      }

      const voter = allVoters[scholarId];
      voters.push(voter);

      // Check if the current user is part of the voters.
      if (voter.userId == currentUserId) {
        votedByUser = true;
      }
    }

    items.push({
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      pitch: row.properties.Pitch.rich_text[0]?.plain_text ?? "",
      voters: voters,
      votedByUser: votedByUser,
      timeSinceCreated: timeSince(row.created_time),
    });
  }

  return items;
}
