import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { User, UsersLookupByEmailResponse } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import { ArrayRollupProperty, notion, Property, RollupProperty } from "../../notion";
import { slack } from "../../slack";
import { getVoterByEmail, Voter } from "./voter";

/** The id of the wishlist database in notion. */
export const wishlistDatabaseId = 'a18536c8d58f4cfe97419700fd5c2d82'

type WishlistRow = PageObjectResponse & {
  properties: {
    Title: Property<'title'>
    Description: Property<'rich_text'>
    Votes: RollupProperty<'number'>
    Voted: Property<'relation'>
    Emails: ArrayRollupProperty<'email'>
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
  let currentUserEmail: string | undefined
  let users: Record<string, Voter> = {}

  for (let row of response.results as WishlistRow[]) {

    var voters: Voter[] = []
    var votedByUser = false

    for (var i in row.properties.Emails.rollup.array) {
      var prop = row.properties.Emails.rollup.array[i]
      var relation = row.properties.Voted.relation[i]

      var email = prop.email;

      if (email == null) {
        continue;
      }

      if (users[email] == null) {
        let voter = await getVoterByEmail(email);
        voter.notionId = relation.id
        users[email] = voter
        if (voter.id == currentUserId) {
          currentUserEmail = email
        }
      }

      voters.push(users[email])

      if (email == currentUserEmail) {
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
