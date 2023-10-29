import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, Property, RollupProperty } from "../../../notion";
import { timeSince } from "../../common/time_since";
import { getVoterByScholarId, Voter } from "./get_voter";

/** The id of the wishlist database in notion. */
export const wishlistDatabaseId = 'a18536c8d58f4cfe97419700fd5c2d82'

/**
 * Type definition for a row in the Wishlist database.
 */
type WishlistRow = PageObjectResponse & {
  properties: {
    Title: Property<'title'>
    Description: Property<'rich_text'>
    Votes: RollupProperty<'number'>
    Voted: Property<'relation'>
  }
}

/**
 * Interface for a wishlist item.
 */
export interface WishlistItem {
  id: string
  title: string
  description: string
  voters: Voter[]
  votedByUser: boolean
  timeSinceCreated: string
}

/**
 * Queries all items from the wishlist database sorted by votes and creation time.
 * For each item it additionally retrieves the list of voters including name and profile image.
 * 
 * @param currentUserId The id of the current user.
 * @returns A list of wishlist items.
 */
export async function queryWishlistItems(currentUserId: string): Promise<WishlistItem[]> {
  const response = await notion.databases.query({
    database_id: wishlistDatabaseId,
    sorts: [
      {
        property: 'Votes',
        direction: 'descending'
      },
      {
        timestamp: 'created_time',
        direction: 'descending'
      }
    ]
  });

  let items: WishlistItem[] = []

  // Keep track of voters across different items, to not fetch a voter twice.
  let allVoters: Record<string, Voter> = {}

  for (let row of response.results as WishlistRow[]) {

    let voters: Voter[] = []
    let votedByUser = false

    for (const voted of row.properties.Voted.relation) {
      
      const scholarId = voted.id

      if (allVoters[scholarId] == null) {
        allVoters[scholarId] = await getVoterByScholarId(scholarId)
      }

      const voter = allVoters[scholarId]
      voters.push(voter)

      // Check if the current user is part of the voters.
      if (voter.userId == currentUserId) {
        votedByUser = true
      }
    }

    items.push({
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      description: row.properties.Description.rich_text[0].plain_text,
      voters: voters,
      votedByUser: votedByUser,
      timeSinceCreated: timeSince(row.created_time)
    })
  }


  return items;
}
