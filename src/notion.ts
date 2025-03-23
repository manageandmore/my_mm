import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  UpdateDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { notionToken } from "./constants";
import { Prop } from "./utils";

/**
 * The api client to access the notion api.
 */
export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
});

type AnyProperty = Prop<PageObjectResponse, "properties">[string];

/** All available types for a database property. E.g. "title", "number", "rollup", ... */
export type PropertyType = Prop<AnyProperty, "type">;
/** A database property of a specific type. */
export type Property<T extends PropertyType> = Extract<
  AnyProperty,
  { type: T }
>;

type AnyRollupProperty = Prop<Property<"rollup">, "rollup">;
/** All available types for the value of a rollup database property. E.g. "number", "array", ... */
export type RollupType = Prop<AnyRollupProperty, "type">;
/** A rollup database property of a specific value type. */
export type RollupProperty<T extends RollupType> = Property<"rollup"> & {
  rollup: Extract<AnyRollupProperty, { type: T }>;
};

type AnyArrayRollupProperty = Prop<
  Prop<RollupProperty<"array">, "rollup">,
  "array"
>[any];
/** All available types for an item in the array value of a rollup database property. */
export type RollupArrayType = Prop<AnyArrayRollupProperty, "type">;
/** An array rollup database property of a specific array type. */
export type ArrayRollupProperty<T extends RollupArrayType> =
  RollupProperty<"array"> & {
    rollup: { array: Extract<AnyArrayRollupProperty, { type: T }>[] };
  };

type AnyFormulaProperty = Prop<Property<"formula">, "formula">;
export type FormulaType = Prop<AnyFormulaProperty, "type">;
export type FormulaProperty<T extends FormulaType> = Property<"formula"> & {
  formula: Extract<AnyFormulaProperty, {type: T}>;
}

export type RichTextItemRequest = (UpdateDatabaseParameters extends {
  description?: infer T;
}
  ? T
  : never)[any];

/**
 * Helper type to define a typed database row returned from `notion.databases.query()`.
 *
 * Use this to define the set of properties for a database row, e.g.:
 * ```typescript
 * type MyDatabaseRow = DatabaseRow<{
 *   Name: Property<"title">;
 *   MySelectProp: Property<"select">;
 *   MyRollupProp: RollupProperty<"number">;
 * }>;
 * ```
 *
 * When querying, this type can then be used to get the property values in a type-safe way:
 * ```typescript
 * let response = notion.databases.query({database_id: ...});
 * for (let row of response.rows as MyDatabaseRow[]) {
 *   console.log("Row", row.properties.Name, row.properties.MySelectProp, row.properties.MyRollupProp);
 * }
 * ```
 */
export type DatabaseRow<T extends Record<string, Property<any>>> = Omit<
  PageObjectResponse,
  "properties"
> & { properties: T };

/**
 * Helper type for a database query that filters the returned properties.
 *
 * Use this together with the `filter_properties` option when querying a notion database, e.g.
 * ```typescript
 * let response = notion.databases.query({database_id: ..., filter_properties: [namePropertyId]});
 * for (let row of response.rows as Filter<MyDatabaseRow, "Name">[]) {
 *   console.log("Row", row.properties.Name);
 * }
 * ```
 */
export type Filter<
  T extends PageObjectResponse,
  K extends keyof Prop<T, "properties">
> = Omit<T, "properties"> & {
  properties: Pick<Prop<T, "properties">, K>;
};
