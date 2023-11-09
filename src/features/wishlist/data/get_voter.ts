import { kv } from "@vercel/kv";
import { User } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import {
  getScholarIdFromUserId,
  getUserById,
  getUserIdFromScholarId,
} from "../../common/id_utils";
import { ONE_WEEK } from "../../common/time_utils";

/**
 * The interface for a voter on a wishlist item.
 *
 * This holds both the voters scholarId and userId for later consumption by the app.
 */
export interface Voter {
  userId?: string;
  scholarId: string;
  name: string;
  imageUrl: string;
}

/**
 * Retrieves a voter object for a given scholarId.
 *
 * Since a users name and profile image is not expected to change often, the result is cached for one week.
 *
 * @param scholarId The id of the scholar entry.
 * @returns The voter object.
 */
export async function getVoterByScholarId(scholarId: string): Promise<Voter> {
  // Check if the voter for a scholarId is cached.
  const cached = await kv.get<Voter>(`voter:${scholarId}`);
  if (cached != null) {
    return cached;
  }

  let voter: Voter;
  try {
    const userId = await getUserIdFromScholarId(scholarId);
    const user = await getUserById(userId);

    voter = getVoterForUser(user!, scholarId);
  } catch (e) {
    voter = {
      scholarId: scholarId,
      name: "Unknown",
      imageUrl: "_",
    };
  }

  // Caches the voter object with an expiration of one week.
  await kv.set(`voter:${scholarId}`, voter, { ex: ONE_WEEK });

  return voter;
}

/**
 * Retrieves a voter object for a given userId.
 *
 * @param userId The id of a slack user.
 * @returns The voter object.
 */
export async function getVoterById(userId: string): Promise<Voter> {
  const scholarId = await getScholarIdFromUserId(userId);
  return getVoterByScholarId(scholarId);
}

/**
 * Transforms a user into a voter object.
 *
 * @param user The user object.
 * @param scholarId The scholarId of that user.
 * @returns The voter object.
 */
function getVoterForUser(user: User, scholarId: string): Voter {
  var imageUrl = getImageUrlForUser(user);
  return {
    userId: user.id,
    scholarId: scholarId,
    name: user.real_name ?? user.name ?? "Unknown",
    imageUrl: imageUrl,
  };
}

/**
 * Returns the smallest available profile image of a user.
 *
 * @param user The user object.
 * @returns The image url.
 */
function getImageUrlForUser(user: User | undefined): string {
  var profile = user?.profile;
  return (
    profile?.image_24 ??
    profile?.image_32 ??
    profile?.image_48 ??
    profile?.image_72 ??
    profile?.image_192 ??
    profile?.image_512 ??
    profile?.image_original ??
    "_"
  );
}
