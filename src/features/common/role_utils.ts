import { Filter, notion } from "../../notion";
import { getScholarIdFromUserId } from "./id_utils";
import { ONE_WEEK } from "./time_utils";
import { notionEnv } from "../../constants";
import { cache } from "./cache";
import { ScholarRow } from "../home/data/query_profile";

const rolesPropertyId = notionEnv == "production" ? "gxSS" : "yQJE";

/**
 * Retrieves the roles assigned to a user.
 *
 * This method is primarily used for checking feature flags.
 * Because the roles of a user are not expected to not change frequently, the result is cached for one week.
 *
 * @param userId The id of a user.
 * @returns The roles assigned to that user.
 */
export async function getRolesForUser(userId: string): Promise<string[]> {
  // Check if the users roles are cached.
  const cachedRoles = await cache.get<string[]>(`roles:${userId}`);
  if (cachedRoles != null) {
    return cachedRoles;
  }

  try {
    const scholarId = await getScholarIdFromUserId(userId);

    const response = (await notion.pages.retrieve({
      page_id: scholarId,
      filter_properties: [rolesPropertyId],
    })) as Filter<ScholarRow, "Roles">;

    let roles = response.properties.Roles.multi_select.map((s) => s.name);

    // Cache the users roles with an expiration of one week.
    await cache.set(`roles:${userId}`, roles, { ex: ONE_WEEK });

    return roles;
  } catch (_) {
    // When the user has no entry in the scholars database, assume no assigned roles, but don't cache.
    return [];
  }
}

/** Purges all user associated roles from the cache. */
export async function refreshRoles(): Promise<void> {
  await cache.delAll("roles:*");
}
