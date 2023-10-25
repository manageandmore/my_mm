import { Client } from "@notionhq/client"
import { notionToken } from "../constants"

/**
 * The api client to access the notion api.
 */
export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
})

/** The id of the scholars database in notion. */
export const scholarsDatabaseId = '9fd93456efb34c6f9fe1ca63fa376899'
/** The id of the community credits database in notion. */
export const creditsDatabaseId = '1d617de2cf7c42c8bb78c1efaf1b2b3f'