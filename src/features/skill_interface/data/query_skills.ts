import { DatabaseRow, Property, notion } from "../../../notion";
import { getScholarIdFromUserId, skillDatabaseId } from "../../common/id_utils";

/** Interface for one Skill List of Lists for the Scholar */
export interface SkillItem {
  expertSkills: string[];
  intermediateSkills: string[];
  beginnerSkills: string[];
}

/** Type definition for a row in the Skills databas */
export type SkillRow = DatabaseRow<{
  Scholar: Property<"relation">;
  Skill: Property<"title">;
  SkillLevel: Property<"select">;
}>;

/** function queries notion for the skill list of a scholar */
export async function querySkillList(userId: string): Promise<SkillItem> {
  try {
    const scholarId = await getScholarIdFromUserId(userId);

    // Helper function to query skills by level
    async function getSkillsByLevel(level: string): Promise<string[]> {
      const response = await notion.databases.query({
        database_id: skillDatabaseId,
        filter: {
          and: [
            {
              property: "Skill Level",
              select: {
                equals: level,
              },
            },
            {
              property: "Scholar",
              relation: {
                contains: scholarId,
              },
            },
          ],
        },
      });

      // Assuming that the skills are returned as page properties
      // This might need to be adjusted based on how the data is structured in Notion
      return (response.results as SkillRow[]).map((result) => {
        const props = result.properties;
        console.log(props);
        return props.Skill.title[0]?.plain_text ?? "Unknown";
      });
    }

    // Query skills by level
    const expertSkills = await getSkillsByLevel("Expert");
    const intermediateSkills = await getSkillsByLevel("Intermediate");
    const beginnerSkills = await getSkillsByLevel("Beginner");

    // Combine skills into a single SkillList object
    const skillList: SkillItem = {
      expertSkills: expertSkills,
      intermediateSkills: intermediateSkills,
      beginnerSkills: beginnerSkills,
    };

    return skillList;
  } catch (e) {
    console.error("Error fetching skill list", e);
    // Return an object with empty arrays if there is an error
    return {
      expertSkills: [],
      intermediateSkills: [],
      beginnerSkills: [],
    };
  }
}
