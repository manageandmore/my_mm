import { notionEnv } from "../../../constants";
import { DatabaseRow, Property, notion } from "../../../notion";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { SkillItems } from "./skill_stack";

/** The id of the skills database in notion. */
export const skillDatabaseId =
  notionEnv == "production"
    ? "38bb222d07234f50ba5b6d94fc742e85"
    : "76dca6588e9544fbbc6a763159b8c1c9";

/** Interface definition with all skill names sorted per level in string arrayy */
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

/** Type definition for a filter for the query of the skill database */
export type Filter = {
  property: string;
  type: string;
  field: string;
  value: string;
};

/** Creates and returns a filter for a notion query */
export async function getScholarFilter(scholarId: string): Promise<Filter> {
  return {
    property: "Scholar",
    type: "relation",
    field: "contains",
    value: scholarId,
  };
}

/** Creates and returns a filter based on given skill level for a notion query */
export async function getSkillLevelFilter(skillLevel: string): Promise<Filter> {
  return {
    property: "Skill Level",
    type: "select",
    field: "equals",
    value: skillLevel,
  };
}

/** Creates and returns a filter based on given skill level for a notion query */
export async function getSkillFilter(skill: string): Promise<Filter> {
  return {
    property: "Skill",
    type: "title",
    field: "equals",
    value: skill,
  };
}

/**
 * function queries notion for all skill entries for a given scholar
 * returns a SkillItems object with all skill entries
 *
 */
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

/**
 * Wrapper function to query skills by level
 * returns a string array with all skill names for a given level
 *
 */
export async function getSkillsByLevel(
  skillList: SkillItems,
  userId: string,
  level: string
): Promise<string[]> {
  const skillListByLevel =
    skillList.items?.filter(
      (item: { skillLevel: string }) => item.skillLevel === level
    ) ?? [];
  return skillListByLevel.map((item: { skillName: string }) => item.skillName);
}

/**
 * Wrapper function to query skills by scholar
 * returns a SkillItems object with all skill entries for a given scholar
 *
 */
export async function getSkillsByScholar(userId: string): Promise<SkillItems> {
  const scholarId = await getScholarIdFromUserId(userId);
  const filters = [await getScholarFilter(scholarId)];
  const skillList = await querySkillDatabase(filters);
  return skillList;
}

/**
 * Wrapper function to query skills by scholar and format them for the home view
 * returns a SkillListPerLevel object with all skill entries for a given scholar
 *
 */
export async function querySkillListForHomeView(
  userId: string
): Promise<SkillListPerLevel> {
  const skillList = await getSkillsByScholar(userId);
  const beginnerSkills = await getSkillsByLevel(skillList, userId, "Beginner");
  const intermediateSkills = await getSkillsByLevel(
    skillList,
    userId,
    "Intermediate"
  );
  const expertSkills = await getSkillsByLevel(skillList, userId, "Expert");
  return {
    beginner: beginnerSkills,
    intermediate: intermediateSkills,
    expert: expertSkills,
  };
}
