import { notion } from "../../../notion";
import { ideaFactoryDatabaseId } from "./query_items";
import { getUserIdFromScholarId } from "../../common/id_utils";

/**
 * Interface for a new idea factory item.
 */
interface NewIdeaItem {
  title: string;
  pitch: string;
  description: string;
  createdBy: string;
  categoryId: string;
}

/**
 * Creates a new entry in the idea factory database.
 *
 * @param item The data for the new entry.
 */
export async function addIdea(item: NewIdeaItem) {
  // Get the Notion user ID from the scholar ID
  const notionUserId = await getUserIdFromScholarId(item.createdBy);

  await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: ideaFactoryDatabaseId,
    },
    properties: {
      Title: {
        type: "title",
        title: [{ type: "text", text: { content: item.title } }],
      },
      "Reason Final Decision": {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: "" } }],
      },
      Pitch: {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.pitch } }],
      },
      Description: {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.description } }],
      },
      "Initiated by": {
        type: "people",
        people: [{ id: notionUserId }]
      },
      // Set the creating user as the first voter on this entry.
      Voted: {
        type: "relation",
        relation: [{ id: notionUserId }],
      },
      Category: {
        type: "select",
        select: {
          id: item.categoryId,
        }
      }
    },
  });
}
