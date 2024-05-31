import { DatabaseRow, notion, Property, RollupProperty } from "../../../notion";

/** The interface for a user profile in the scholars database. */
export interface ScholarProfile {
  name: string;
  email?: string;
  ip: string;
  ep: string;
  generation: string;
  status: string;
  credits: number;
  person?: string;
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
  Person: Property<"people">;
  Roles: Property<"multi_select">;
}>;

/**
 * Retrieves the profile for some scholar.
 *
 * @param scholarId The id of the requested scholar.
 * @returns The profile of the requested scholar.
 */
export async function queryScholarProfile(
  scholarId: string
): Promise<ScholarProfile> {
  try {
    const response = (await notion.pages.retrieve({
      page_id: scholarId,
    })) as ScholarRow;

    const props = response.properties;

    return {
      name: props.Name.title[0].plain_text,
      email: props.Email.email ?? undefined,
      ip: props.IP.select?.name ?? "/",
      ep: props.EP.select?.name ?? "/",
      generation: props.Generation.number?.toString() ?? "Unknown",
      status: props.Status.select?.name ?? "Unknown",
      credits: props["Community Credits"].rollup.number ?? 0,
      person: props["Person"].people.shift()?.id,
      url: response.url,
    };
  } catch (e) {
    console.error("Error fetching scholar profile", e);
    throw Error(
      "Could not read profile for scholar with id " + scholarId + "."
    );
  }
}
