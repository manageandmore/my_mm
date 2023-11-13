import { DatabaseRow, Property, notion } from "../../../notion";
import { getScholarIdFromUserId, skillDatabaseId } from "../../common/id_utils";
import { SkillItem, SkillItems } from "./skill_stack";


export interface SkillListPerLevel {
  beginner: string[];
  intermediate: string[];
  expert: string[];
}

/** Type definition for a row in the Skills database */
export type SkillRow = DatabaseRow<{
  Scholar: Property<"relation">;
  Skill: Property<"title">;
  "Skill Level": Property<"select">;
}>;

export type Filter = {
  property: string;
  type: string;
  field: string;
  value: string;
};

export async function getScholarFilter(scholarId: string): Promise<Filter> {
  return {
    property: "Scholar",
    type: "relation",
    field: "contains",
    value: scholarId,
  };
}

export async function getSkillLevelFilter(skillLevel: string): Promise<Filter> {
  return {
    property: "Skill Level",
    type: "select",
    field: "equals",
    value: skillLevel,
  };
}

export async function getSkillFilter(skill: string): Promise<Filter> {
  return {
    property: "Skill",
    type: "title",
    field: "equals",
    value: skill,
  };
}

//UNUSED RIGHT NOW
/** function queries notion for the skill list of a scholar */
export async function querySkillDatabase(
  filters: Filter[]
): Promise<SkillItems> {
  try {
    const combinedFilter: any[] = [];
    for (const filter of filters) {
      combinedFilter.push({
        property: filter.property,
        [filter.type]: { [filter.field]: filter.value },
      });
    }

    const response = await notion.databases.query({
      database_id: skillDatabaseId,
      filter: {
        and: combinedFilter,
      },
    });

    const skillItems: SkillItems = {
      items: (response.results as SkillRow[]).map((result) => {
        const props = result.properties;
        const id = result.id;

        return {
          id: id ?? "Unknown",
          scholar: props.Scholar.relation[0]?.id ?? "Unknown",
          skillName: props.Skill.title[0]?.plain_text ?? "Unknown",
          skillLevel: props["Skill Level"].select?.name ?? "Unknown",
          status: "active", 
        };
      }),
    };

    return skillItems;
  } catch (error) {
    console.error(error);
    return { items: [] };
  }
}


// Helper function to query skills by level from skill stack
export async function getSkillsByLevel(
  skillList: SkillItems,
  userId: string,
  level: string
): Promise<string[]> {
  const skillListByLevel = skillList.items?.filter((item: { skillLevel: string }) => item.skillLevel === level) ?? [];
  return(skillListByLevel.map((item: { skillName: string; }) => item.skillName));
}

// Helper function to query skills by scholar
export async function getSkillsByScholar(
  userId: string,
): Promise<SkillItems> {
  const scholarId = await getScholarIdFromUserId(userId);
  const filters = [await getScholarFilter(scholarId)];
  const skillList = await querySkillDatabase(filters);
  return skillList;
}


export async function querySkillListForHomeView(
  userId: string
): Promise<SkillListPerLevel> {
  const skillList = await getSkillsByScholar(userId);
  const beginnerSkills = await getSkillsByLevel(skillList, userId, "Beginner");
  const intermediateSkills = await getSkillsByLevel(skillList, userId, "Intermediate");
  const expertSkills = await getSkillsByLevel(skillList, userId, "Expert");
  return {
    beginner: beginnerSkills,
    intermediate: intermediateSkills,
    expert: expertSkills,
  };
}


