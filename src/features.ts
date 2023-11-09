import { kv } from "@vercel/kv";
import { getRolesForUser } from "./features/common/role_utils";
import { DatabaseRow, Property, RichTextItemRequest, notion } from "./notion";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { Prop, hash } from "./utils";

/** The id of the feature flags database in notion. */
const featureFlagsDatabaseId = "e8efe34c14e64132baca7b3f131c319e";

/**
 * Type definition for feature flag options.
 *
 * Use together with `features.register(feature: FeatureFlagOptions)`.
 *
 * Defines the label and available tags for a feature flag.
 */
type FeatureFlagOptions = {
  label: string;
  description: string;
  tags: readonly TagOption[];
};

/**
 * Type definition for a tag option of a feature flag.
 *
 * A tag has either just a name, or a name and an additional value.
 */
type TagOption = {
  name: string;
  description: string;
  value?: TagValueIdentifier;
};

/** All available tag value types mapped by their identifier. */
type TagValueTypes = { date: Date } & { number: number } & { string: string };
type TagValueIdentifier = keyof TagValueTypes;

/**
 * The value of a feature flag after it was read.
 *
 * Contains the label, roles and resolved tags of a feature flag.
 */
type FeatureFlag<F extends FeatureFlagOptions> = {
  label: Prop<F, "label">;
  roles: string[];
  tags: F extends { tags: readonly (infer T extends TagOption)[] }
    ? Tags<T>
    : never;
};

/**
 * The resolved tags of a feature flag.
 *
 * This is returned as an object, with each tag being a property on that object.
 * Normal tags are a boolean, that represent if that tag is being used or not.
 * Value tags contain the value of the tag if it is used, or `false`.
 */
type Tags<T extends TagOption> = {
  [key in Prop<T, "name">]:
    | TagValue<
        Extract<
          Prop<T & { name: key }, "value">,
          TagValueIdentifier | undefined
        >
      >
    | false;
};

/** The value of a tag property, which is either a boolean or the value type of the tag. */
type TagValue<K extends TagValueIdentifier | undefined> = K extends undefined
  ? boolean
  : Prop<TagValueTypes, Exclude<K, undefined>>;

/**
 * A reference to a feature flag, used to read a feature flag based on its reference.
 *
 * **Beware**: This must never be used manually outside the context of the `register()` and `read()` functions.
 * This type is merely used as a bridge to help the type system statically infer the return type of `read()`.
 * However the implementation of these methods is not guaranteed to follow this types definition.
 *
 * TL;DR: Just don't use a variable of this type for anything else than passing it to `features.read()`.
 */
type FeatureFlagReference<F extends FeatureFlagOptions> = F;

/**
 * Type definition for a row in the Feature Flags database.
 */
type FeatureFlagRow = DatabaseRow<{
  Label: Property<"title">;
  Roles: Property<"multi_select">;
  Tags: Property<"multi_select">;
}>;

/**
 * Manages the feature flags of this application.
 *
 * To use a feature flag, first register the feature flag and store the returned reference in a constant:
 * `const myFeatureFlag = features.register({label: ..., tags: ...} as const);`
 *
 * **For correct typing, make sure to include "as const" after your options object.**
 *
 * Then you can use the stored reference to retrieve the value of the feature flag anywhere in your application:
 * `let currentValue = features.read(myFeatureFlag);`
 */
class FeatureFlags {
  private didInitialize: boolean = false;

  private features: Map<
    string,
    { options: FeatureFlagOptions; value?: FeatureFlag<any> }
  > = new Map();

  /**
   * Registers a new feature flag using the provided options.
   *
   * For correct typing, include "as const" after your options object:
   * `const myFeatureFlag = features.register({label: ..., tags: ...} as const);`
   *
   * This has to be called before `.initialize()`, otherwise it will throw an error.
   *
   * @param feature The provided feature options to register.
   * @returns A reference to the registered feature flag.
   */
  register<F extends FeatureFlagOptions>(feature: F): FeatureFlagReference<F> {
    if (this.didInitialize) {
      throw Error(
        "Already initialized. Make sure to call .register() before .initialize()"
      );
    }
    this.features.set(feature.label, { options: feature });
    return feature.label as any;
  }

  /**
   * Loads the values of all registered feature flags.
   *
   * This will check if cached values exist and can be fully mapped to the registered feature flags.
   * If either the cache does not exist, is expired, or the registered feature flags have changed, the
   * current values are loaded from notion.
   *
   * This will also update the database description in notion to document all registered feature flags when reloading.
   *
   * @param waitUntil The RequestContext.waitUntil method.
   */
  async initialize(waitUntil: (promise: Promise<any>) => void) {
    try {
      let { features, hash: cachedHash } =
        (await kv.get<{ features: any; hash: string }>("feature-flags")) ?? {};

      // We hash the feature flag configuration to detect changes like added or removed flags, or changed tags.
      let currentHash = await hash(Array.from(this.features.entries()));

      if (cachedHash != null && cachedHash == currentHash) {
        // Populate with the cached values and return.
        for (var [id, feature] of features) {
          this.features.set(id, feature);
        }
        return;
      }

      // Load the current feature flags from notion.
      await this.loadFeatureFlags(currentHash);

      // Update the description of flags in notion without blocking the request handler.
      waitUntil(this.updateFeatureDescriptions());
    } finally {
      this.didInitialize = true;
    }
  }

  /**
   * Reads the current value of a feature flag defined by its reference.
   *
   * @param ref The stored reference of the feature flag.
   * @returns The current value of the feature flag.
   */
  read<F extends FeatureFlagOptions>(
    ref: FeatureFlagReference<F>
  ): FeatureFlag<F> {
    if (!this.didInitialize) {
      throw Error(
        "Not yet initialized. Make sure to call .read() after .initialize()"
      );
    }
    return this.features.get(ref as any)?.value!;
  }

  /**
   * Checks if the referenced feature is accessible to the current user.
   *
   * @param ref The stored reference of the feature flag.
   * @param userId: The id of the current user.
   * @returns Whether the feature is accessible.
   */
  async check<F extends FeatureFlagOptions>(
    ref: FeatureFlagReference<F>,
    userId: string
  ): Promise<boolean> {
    if (!this.didInitialize) {
      throw Error(
        "Not yet initialized. Make sure to call .check() after .initialize()"
      );
    }
    let roles = this.features.get(ref as any)?.value!.roles;
    let userRoles = await getRolesForUser(userId);
    return roles?.some((r) => userRoles.includes(r)) ?? false;
  }

  private async loadFeatureFlags(currentHash: string) {
    let query = await notion.databases.query({
      database_id: featureFlagsDatabaseId,
    });

    for (let row of query.results as FeatureFlagRow[]) {
      let label = row.properties.Label.title.map((t) => t.plain_text).join("");
      let feature = this.features.get(label);
      if (feature != null) {
        let roles = row.properties.Roles.multi_select.map((t) => t.name);
        let tags = Object.assign(
          Object.fromEntries(feature.options.tags.map((t) => [t.name, false])),
          Object.fromEntries(
            row.properties.Tags.multi_select
              .map((t) => this.parseTag(t.name, feature!.options.tags))
              .filter((t): t is [string, any] => !!t)
          )
        );

        this.features.set(label, {
          ...feature,
          value: {
            label: label,
            roles: roles,
            tags: tags,
          },
        });
      }
    }

    // Caches the feature flags with an expiration of one day.
    await kv.set(
      "feature-flags",
      { features: Array.from(this.features.entries()), hash: currentHash },
      { ex: 86400 }
    );
  }

  private async updateFeatureDescriptions() {
    let response = (await notion.databases.retrieve({
      database_id: featureFlagsDatabaseId,
    })) as DatabaseObjectResponse;

    let description = this.updateDescriptionWithFeatures(response.description);

    await notion.databases.update({
      database_id: featureFlagsDatabaseId,
      description: description,
    });
  }

  private updateDescriptionWithFeatures(
    description: RichTextItemResponse[]
  ): RichTextItemRequest[] {
    // transform all RichTextItemResponse to RichTextItemRequest
    let updated = description.map<RichTextItemRequest>((r) => {
      // change the incompatible link_preview mention to a link text item
      if ("mention" in r && r.mention.type == "link_preview") {
        return {
          type: "text",
          text: {
            content: "",
            link: { url: r.mention.link_preview.url },
          },
        };
      } else {
        // all other items are compatible
        return r as any;
      }
    });

    // copy the description until the #features marker and remove the rest
    let marker = "#features";
    let markerIndex = updated.findIndex(
      (item) => item.type == "text" && item.text.content.includes(marker)
    );
    if (markerIndex != -1) {
      type TextItemRequest = RichTextItemRequest & { type: "text" };
      let text = (updated[markerIndex] as TextItemRequest).text;
      let textIndex = text.content.indexOf(marker);
      text.content = text.content.substring(0, textIndex + 13) + "\n";
      updated.splice(markerIndex + 1, updated.length - markerIndex);
    } else {
      updated.push({
        type: "text",
        text: { content: `\n${marker}\n` },
      });
    }

    // add the list of features to the description
    for (var [_, { options }] of this.features) {
      updated.push({
        type: "text",
        text: { content: "\n" + options.label },
        annotations: { bold: true },
      });

      updated.push({
        type: "text",
        text: { content: `: ${options.description}\n` },
      });

      for (var tag of options.tags) {
        updated.push({
          type: "text",
          text: { content: "    " },
        });
        updated.push({
          type: "text",
          text: {
            content: `${tag.name}${tag.value != null ? `:<${tag.value}>` : ""}`,
          },
          annotations: { code: true },
        });
        updated.push({
          type: "text",
          text: { content: `: ${tag.description}\n` },
        });
      }
    }

    return updated;
  }

  parseTag(
    tag: string,
    options: readonly TagOption[]
  ): [string, any] | undefined {
    let parts = tag.split(":");
    let name = parts[0];
    let option = options.find((o) => o.name == name);
    if (option == undefined) {
      return;
    }
    let value = parts.length > 1 ? parts[1] : undefined;
    switch (option.value) {
      case undefined:
        return [name, true];
      case "date":
        return [name, new Date(value ?? 0)];
      case "number":
        return [name, Number(value ?? 0)];
      case "string":
        return [name, value ?? ""];
    }
  }
}

/** Entry point for managing feature flags. */
export const features = new FeatureFlags();
