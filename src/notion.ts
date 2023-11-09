import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notionToken } from "./constants";
import { Prop } from "./features";

/**
 * The api client to access the notion api.
 */
export const notion = new Client({
  auth: notionToken,
  fetch: fetch,
});

type AnyProperty = Prop<PageObjectResponse, "properties">[string];
export type PropertyType = Prop<AnyProperty, "type">;
export type Property<T extends PropertyType> = Extract<
  AnyProperty,
  { type: T }
>;

type AnyRollupProperty = Prop<Property<"rollup">, "rollup">;
export type RollupType = Prop<AnyRollupProperty, "type">;
export type RollupProperty<T extends RollupType> = Property<"rollup"> & {
  rollup: Extract<AnyRollupProperty, { type: T }>;
};

type AnyArrayRollupProperty = Prop<
  Prop<RollupProperty<"array">, "rollup">,
  "array"
>[any];
export type RollupArrayType = Prop<AnyArrayRollupProperty, "type">;
export type ArrayRollupProperty<T extends RollupArrayType> =
  RollupProperty<"array"> & {
    rollup: { array: Extract<AnyArrayRollupProperty, { type: T }>[] };
  };
