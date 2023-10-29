import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { creditsDatabaseId, notion, Property, RollupProperty } from "../../notion";


type CommunityCreditsRow = PageObjectResponse & {
  properties: {
    Scholar: Property<'relation'>
    "Total Credits": RollupProperty<"number">
  }
}

/**
 * Queries notion for the community credits of a given user.
 * @param scholarId The id of the requested scholar.
 * @returns The community credits of the scholar, or 0 if not found.
 */
export async function queryCommunityCredits(scholarId: string): Promise<number> {
  const response = await notion.databases.query({
    database_id: creditsDatabaseId,
    filter: {
      property: 'Scholar',
      relation: {
        contains: scholarId
      },
    },
  });

  if (response.results.length == 0) {
    return 0
  } else if (response.results.length > 1) {
    throw Error(`Non-Unique entry in credits database for scholar ${scholarId}`)
  } else {
    const row = response.results[0] as CommunityCreditsRow
    return row.properties["Total Credits"].rollup.number ?? 0
  }
}