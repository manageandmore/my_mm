import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { creditsDatabaseId, notion } from "./notion";

/**
 * Queries notion for the community credits of a given user.
 * @param userId The id of the requested user.
 * @returns The community credits of the user, or 0 if not found.
 */
export async function queryCommunityCredits(userId: string): Promise<number> {
  const dbResponse = await notion.databases.query({
    database_id: creditsDatabaseId,
    filter: {
      property: 'Email',
      rollup: {
        "any": {
          "rich_text": {
        equals: userId,
      }}}
    },
  });

  console.log('notion', dbResponse);

  let points = 0

  if (dbResponse.results.length > 0) {
    const row = dbResponse.results[0] as PageObjectResponse;
    var prop = row.properties.Points
    if (prop.type == "number") {
      points = prop.number ?? points
    }
  }

  return points
}