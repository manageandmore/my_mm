import { DatabaseRow, notion, Property, RollupProperty } from "../../notion";
import { getScholarIdFromUserId } from "../common/id_utils";

/** The interface for a user profile in the scholars database. */
export interface ScholarProfile {
  name: string;
  email?: string;
  ip: string;
  ep: string;
  generation: string;
  status: string;
  credits: number;
  url?: string;
}

/**
 * Type definition for a row in the Scholars database.
 */
export type ScholarRow = DatabaseRow<{
  Name: Property<"title">;
  Email: Property<"email">;
  IP: Property<"select">;
  EP: Property<"select">;
  Generation: Property<"number">;
  Status: Property<"select">;
  "Community Credits": RollupProperty<"number">;
  Roles: Property<"multi_select">;
}>;

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
      url: response.url,
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
