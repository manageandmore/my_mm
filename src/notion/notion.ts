import { Client } from "@notionhq/client"
import { notionToken } from "../constants"

export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
})

export const scholarsDatabaseId = '9fd93456efb34c6f9fe1ca63fa376899'
export const creditsDatabaseId = '1d617de2cf7c42c8bb78c1efaf1b2b3f'