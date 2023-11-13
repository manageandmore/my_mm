//** TODO implement function to add skill item to skill database */

import { notion } from "../../../notion";
import { getScholarIdFromUserId, skillDatabaseId } from "../../common/id_utils";
import { SkillItem, SkillItems } from "./skill_stack";

/**
 *
 */
export async function updateNotionDatabase(
  skillList: SkillItems,
  userId: string
): Promise<boolean> {
  const items = skillList.items ?? [];
  for (const skillItem of items) {
    try {
      if (skillItem.status === "removed") {
        await removeSkillItemFromDatabase(skillItem.id);
      } else if (skillItem.status === "new") {
        await addSkillItemToDatabase(skillItem, userId);
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  return true;
}

/**
 * Creates a new entry in the skill database.
 *
 * @param item The data for the new entry.
 */
export async function addSkillItemToDatabase(item: SkillItem, userId: string) {
  const scholarId = await getScholarIdFromUserId(userId);
  await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: skillDatabaseId,
    },
    properties: {
      Scholar: {
        relation: [{ id: scholarId }],
      },
      // Assuming 'Skill' is the correct field identifier for the select field
      Skill: {
        title: [{ type: "text", text: { content: item.skillName } }],
      },
      // Assuming 'Skill Level' is the correct field identifier for the select field
      "Skill Level": {
        select: { name: item.skillLevel },
      },
    },
  });
}

export async function removeSkillItemFromDatabase(pageId: string) {
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
}
