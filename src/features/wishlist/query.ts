import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { ArrayRollupProperty, notion, Property, RollupProperty } from "../../notion";

/** The id of the wishlist database in notion. */
const wishlistDatabaseId = 'a18536c8d58f4cfe97419700fd5c2d82'

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
  votes: number
}

export async function queryWishlistItems(): Promise<WishlistItem[]> {
  const response = await notion.databases.query({
    database_id: wishlistDatabaseId,
  });

  let items: WishlistItem[] = []

  for (let row of response.results as WishlistRow[]) {
    items.push({
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      description: row.properties.Description.rich_text[0].plain_text,
      votes: row.properties.Votes.rollup.number ?? 0
    })

  }
 
  return items;
}
