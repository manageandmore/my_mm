import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, scholarsDatabaseId } from "./notion";

/** The interface for a user profile in the scholars database. */
export interface Profile {
  name: string
  email: string
  ip: string
  ep: string
  generation: string
  status: string
}

/**
 * Queries the scholars database for a given user.
 * @param userId The id of the requested user.
 * @returns The profile of the requested user.
 */
export async function queryUserProfile(userId: string): Promise<Profile> {
  const response = await notion.databases.query({
    database_id: scholarsDatabaseId,
    filter: {
      property: 'Email',
      title: {
        equals: userId,
      }
    },
  });

  console.log('Notion Profile', response);

  if (response.results.length == 0) {
    return {
      name: 'Unknown',
      email: userId,
      ip: 'Unknown',
      ep: 'Unknown',
      generation: 'Unknown',
      status: 'Unknown',
    }
  }

  const row = response.results[0] as PageObjectResponse;
  const props = row.properties;

  return {
    name: toPlainText(props.Name),
    email: userId,
    ip: toPlainText(props.IP),
    ep: toPlainText(props.EP),
    generation: toPlainText(props.Generation),
    status: toPlainText(props.Status)
  }
}

declare var _r: PageObjectResponse;
type Property = typeof _r.properties[string];

/** 
 * Helper function to transform a notion database property to plaintext.
 */
function toPlainText(prop: Property): string {
  if (prop == null) {
    return 'Unknown'
  } else if (prop.type == 'title') {
   return prop.title[0].plain_text
  } else if (prop.type == 'rich_text') {
    return prop.rich_text[0].plain_text
  } else if (prop.type == 'select') {
    return prop.select?.name ?? '/'
  } else if (prop.type == 'number') {
    return prop.number?.toString() ?? 'Unknown'
  } else {
    return 'Unknown'
  }
}