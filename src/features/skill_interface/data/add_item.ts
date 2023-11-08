//** TODO implement function to add skill item to skill database */

import { notion } from "../../../notion";
import { skillDatabaseId } from "../../common/id_utils";

/**
 * Interface for a new wishlist item.
 */
interface NewSkillItem {
  name: string;
  skillLevel: string;
  createdBy: string;
}

/**
 * Creates a new entry in the wishlist database.
 *
 * @param item The data for the new entry.
 */
export async function addSkillItem(item: NewSkillItem) {
  await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: skillDatabaseId,
    },
    properties: {
      Scholar: {
        relation: [{ id: item.createdBy }],
      },
      // Assuming 'Skill' is the correct field identifier for the select field
      Skill: {
        title: [{ type: "text", text: { content: item.name } }],
      },
      // Assuming 'Skill Level' is the correct field identifier for the select field
      "Skill Level": {
        select: { name: item.skillLevel },
      },
    },
  });
}
