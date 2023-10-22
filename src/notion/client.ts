import { Client } from "@notionhq/client"
import { notionToken } from "../constants"

export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
})

export const pointsDatabaseId = '1d617de2cf7c42c8bb78c1efaf1b2b3f'