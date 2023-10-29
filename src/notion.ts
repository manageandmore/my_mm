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
export type ArrayRollupProperty<T extends RollupArrayType> = RollupProperty<'array'> & {rollup: {array: Extract<typeof __ra, {type: T}>[]}}