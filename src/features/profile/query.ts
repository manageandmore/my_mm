import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, scholarsDatabaseId, toPlainText } from "../../notion";

/** The interface for a user profile in the scholars database. */
export interface Profile {
  id?: string
  name: string
  email: string
  ip: string
  ep: string
  generation: string
  status: string
}

/**
 * Queries the scholars database for a given user.
 * @param email The email of the requested user.
 * @returns The profile of the requested user.
 */
export async function queryUserProfile(email: string): Promise<Profile> {
  const response = await notion.databases.query({
    database_id: scholarsDatabaseId,
    filter: {
      property: 'Email',
      title: {
        equals: email,
      }
    },
  });

  console.log('Notion Profile', response);

  if (response.results.length == 0) {
    return {
      name: 'Unknown',
      email: email,
      ip: 'Unknown',
      ep: 'Unknown',
      generation: 'Unknown',
      status: 'Unknown',
    }
  }

  const row = response.results[0] as PageObjectResponse;
  const props = row.properties;

  return {
    id: row.id,
    name: toPlainText(props.Name),
    email: email,
    ip: toPlainText(props.IP),
    ep: toPlainText(props.EP),
    generation: toPlainText(props.Generation),
    status: toPlainText(props.Status)
  }
}