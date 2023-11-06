import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, Property, RollupProperty } from "../../notion";
import { getScholarIdFromUserId, scholarsDatabaseId, skillDatabaseId } from "../common/id_utils";
import { CreditsLeaderboardItem, SkillItem } from "../home/view";

/** The interface for a user profile in the scholars database. */
export interface ScholarProfile {
  name: string;
  email?: string;
  ip: string;
  ep: string;
  generation: string;
  status: string;
  credits: number;
}

/**
 * Type definition for a row in the Scholars database.
 */
export type ScholarRow = PageObjectResponse & {
  properties: {
    Name: Property<"title">;
    Email: Property<"email">;
    IP: Property<"select">;
    EP: Property<"select">;
    Generation: Property<"number">;
    Status: Property<"select">;
    "Community Credits": RollupProperty<"number">;
  };
};

/** Type definition for a row in the Skills databas */
export type SkillRow = PageObjectResponse & {
  properties: {
    Scholar: Property<"relation">;
    Skill: Property<"select">;
    SkillLevel: Property<"select">;
  };
};


/**
 * Retrieves the profile for some scholar.
 *
 * @param scholarId The id of the requested scholar.
 * @returns The profile of the requested scholar.
 */
export async function queryScholarProfile(
  userId: string
): Promise<ScholarProfile> {
  try {
    const scholarId = await getScholarIdFromUserId(userId);

    const response = (await notion.pages.retrieve({
      page_id: scholarId,
    })) as ScholarRow;

    console.log("Notion Profile", response);

    const props = response.properties;

    return {
      name: props.Name.title[0].plain_text,
      email: props.Email.email ?? undefined,
      ip: props.IP.select?.name ?? "/",
      ep: props.EP.select?.name ?? "/",
      generation: props.Generation.number?.toString() ?? "Unknown",
      status: props.Status.select?.name ?? "Unknown",
      credits: props["Community Credits"].rollup.number ?? 0,
    };
  } catch (e) {
    console.error("Error fetching scholar profile", e);
    // TODO Add a new empty profile to notion.
    return {
      name: "Unknown",
      ip: "/",
      ep: "/",
      generation: "Unknown",
      status: "Unknown",
      credits: 0,
    };
  }
}

/** function queries notion for the top 3 entries of the credit leaderboard */
export async function queryCreditsLeaderboard(): Promise<CreditsLeaderboardItem[]> {
  try {

    const response = await notion.databases.query({
      database_id: scholarsDatabaseId,
      filter: {
        property: "Status",
        select: {
          equals: "Active",
        },
      },
      sorts: [
        {
          property: "Community Credits",
          direction: "descending",
        },
      ],
      page_size: 3,
    });

    return (response.results as ScholarRow[]).map((result) => {
      const props = result.properties;

      return {
        name: props.Name.title[0].plain_text,
        credits: props["Community Credits"].rollup.number ?? 0,
      };
    });
  } catch (e) {
    console.error("Error fetching credits leaderboard", e);
    return [];
  }
}

/** function queries notion for the skill list of a scholar */
export async function querySkillList(
  userId: string
): Promise<SkillItem> {
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
              }
            },
            {
              property: "Scholar",
              relation: {
                contains: scholarId,
              }
            }
          ]
        },
      });

      // Assuming that the skills are returned as page properties
      // This might need to be adjusted based on how the data is structured in Notion
      return (response.results as SkillRow[]).map((result) => {
        const props = result.properties;
        return props.Skill.select?.name ?? "Unknown";
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