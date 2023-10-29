import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, Property } from "../../notion";

/** The interface for a user profile in the scholars database. */
export interface ScholarProfile {
  id: string
  name: string
  email?: string
  ip: string
  ep: string
  generation: string
  status: string
}

/**
 * Type definition for a row in the Scholars database.
 */
export type ScholarRow = PageObjectResponse & {
  properties: {
    Name: Property<'rich_text'>
    Email: Property<'email'>
    IP: Property<'select'>
    EP: Property<'select'>
    Generation: Property<'number'>
    Status: Property<'select'>
  }
}

/**
 * Retrieves the profile for some scholar.
 * 
 * @param scholarId The id of the requested scholar.
 * @returns The profile of the requested scholar.
 */
export async function queryScholarProfile(scholarId: string): Promise<ScholarProfile> {
  try {
    const response = await notion.pages.retrieve({
      page_id: scholarId
    }) as ScholarRow

    console.log('Notion Profile', response);

    const props = response.properties;

    return {
      id: response.id,
      name: props.Name.rich_text[0].plain_text,
      email: props.Email.email ?? undefined,
      ip: props.IP.select?.name ?? '/',
      ep: props.EP.select?.name ?? '/',
      generation: props.Generation.number?.toString() ?? 'Unknown',
      status: props.Status.select?.name ?? 'Unknown'
    }
  } catch (e) {
    // TODO Add a new empty profile to notion.
    return {
      id: scholarId,
      name: 'Unknown',
      ip: '/',
      ep: '/',
      generation: 'Unknown',
      status: 'Unknown',
    }
  }
}