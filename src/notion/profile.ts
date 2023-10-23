import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, scholarsDatabaseId } from "./notion";

export interface Profile {
  name: string
  email: string
  ip: string
  ep: string
  generation: string
  status: string
}

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