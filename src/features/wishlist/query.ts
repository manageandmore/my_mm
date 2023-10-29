import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, Property, RollupProperty } from "../../notion";
import { getVoterByScholarId, Voter } from "./voter";

/** The id of the wishlist database in notion. */
export const wishlistDatabaseId = 'a18536c8d58f4cfe97419700fd5c2d82'

type WishlistRow = PageObjectResponse & {
  properties: {
    Title: Property<'title'>
    Description: Property<'rich_text'>
    Votes: RollupProperty<'number'>
    Voted: Property<'relation'>
  }
}

export interface WishlistItem {
  id: string
  title: string
  description: string
  voters: Voter[]
  votedByUser: boolean
}


export async function queryWishlistItems(currentUserId: string): Promise<WishlistItem[]> {
  const response = await notion.databases.query({
    database_id: wishlistDatabaseId,
  });

  let items: WishlistItem[] = []
  let currentScholarId: string | undefined
  let allVoters: Record<string, Voter> = {}

  for (let row of response.results as WishlistRow[]) {

    var voters: Voter[] = []
    var votedByUser = false

    for (var voted of row.properties.Voted.relation) {
      
      var scholarId = voted.id

      if (allVoters[scholarId] == null) {
        let voter = await getVoterByScholarId(scholarId)
        allVoters[scholarId] = voter

        if (voter.id == currentUserId) {
          currentScholarId = scholarId
        }
      }

      voters.push(allVoters[scholarId])

      if (scholarId == currentScholarId) {
        votedByUser = true
      }
    }

    items.push({
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      description: row.properties.Description.rich_text[0].plain_text,
      voters: voters,
      votedByUser: votedByUser,
    })
  }


  return items;
}
