import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { creditsDatabaseId, notion } from "./notion";

export async function queryCommunityCredits(userId: string): Promise<number> {
  const dbResponse = await notion.databases.query({
    database_id: creditsDatabaseId,
    filter: {
      property: 'Name',
      title: {
        equals: userId,
      }
    },
  });

  console.log('notion', dbResponse);

  let points = 0

  if (dbResponse.results.length > 0) {
    const row = dbResponse.results[0] as PageObjectResponse;
    var prop = row.properties.Points
    if (prop.type == "number") {
      points = prop.number
    }
  }

  return points
}