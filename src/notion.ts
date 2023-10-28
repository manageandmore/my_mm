import { Client } from "@notionhq/client"
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { notionToken } from "./constants"

/**
 * The api client to access the notion api.
 */
export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
})

declare var _r: PageObjectResponse;
declare var __r: typeof _r.properties[any];

export type PropertyType = typeof __r.type
export type Property<T extends PropertyType> = Extract<typeof _r.properties[string], {type: T}>;

declare var _rr: Property<'rollup'>

export type RollupType = typeof _rr.rollup.type
export type RollupProperty<T extends RollupType> = Property<'rollup'> & {rollup: Extract<typeof _rr.rollup, {type: T}>}

declare var _ra: RollupProperty<'array'>
declare var __ra: typeof _ra.rollup.array[number]

export type RollupArrayType = typeof __ra.type
export type ArrayRollupProperty<T extends RollupArrayType> = /*RollupProperty<'array'> & */{rollup: {array: Extract<typeof __ra, {type: T}>[]}}

/** The id of the scholars database in notion. */
export const scholarsDatabaseId = '9fd93456efb34c6f9fe1ca63fa376899'
/** The id of the community credits database in notion. */
export const creditsDatabaseId = '1d617de2cf7c42c8bb78c1efaf1b2b3f'

/** 
 * Helper function to transform a notion database property to plaintext.
 */
export function toPlainText(prop: Property<any>): string {
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