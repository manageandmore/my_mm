import { notion } from "../../../notion"
import { wishlistDatabaseId } from "./query_items"

/**
 * Interface for a new wishlist item.
 */
interface NewWishlistItem {
  title: string
  description: string
  createdBy: string
}

/**
 * Creates a new entry in the wishlist database.
 * 
 * @param item The data for the new entry.
 */
export async function addWishlistItem(item: NewWishlistItem) {
  await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id: wishlistDatabaseId
    },
    properties: {
      Title: {
        type: 'title',
        title: [{type: 'text', text: {content: item.title}}]
      },
      Description: {
        type: 'rich_text',
        rich_text: [{type: 'text', text: {content: item.description}}]
      },
      // Set the creating user as the first voter on this entry.
      Voted: {
        type: 'relation',
        relation: [{id: item.createdBy}]
      }
    }
  })
}