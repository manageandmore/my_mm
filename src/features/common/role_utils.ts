import { Filter, notion } from "../../notion";
import { ScholarRow } from "../profile/query";
import { getScholarIdFromUserId } from "./id_utils";
import { kv } from "@vercel/kv";

const rolesPropertyId = "yQJE";

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
  const cachedRoles = await kv.get<string[]>(`roles:${userId}`);
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
    await kv.set(`roles:${userId}`, roles, { ex: 604800 });

    return roles;
  } catch (_) {
    // When the user has no entry in the scholars database, assume no assigned roles, but don't cache.
    return [];
  }
}
