import { slack } from "../../slack";
import { notion } from "../../notion";
import { ScholarRow } from "../profile/query";
import { User as SlackUser } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import { notionEnv } from "../../constants";
import { cache } from "../../utils";

export type User = SlackUser;

/** The id of the scholars database in notion. */
export const scholarsDatabaseId =
  notionEnv == "production"
    ? "258576df97e347fa89b0ab2b237d3118"
    : "9fd93456efb34c6f9fe1ca63fa376899";

/**
 * Retrieves the associated scholarId for a given userId.
 *
 * This method is needed to match slack users with the appropriate entry in the scholars database in notion.
 * The current implementation uses the email address to match users across slack and notion, but this should be
 * transparent to the caller.
 * Because a given userId:scholarId pair is expected to not change, the result is cached and used when called again.
 *
 * @param userId The id of a slack user.
 * @returns The id of the associated scholar entry in notion.
 */
export async function getScholarIdFromUserId(userId: string): Promise<string> {
  // Check if the associated scholarId is cached.
  const cachedScholarId = await cache.get<string>(`scholarId:${userId}`);
  if (cachedScholarId != null) {
    return cachedScholarId;
  }

  // Get the email for the user.
  const email = await getEmailForUser(userId);
  if (email == null) {
    throw Error(`Cannot find email for user ${userId}`);
  }

  // Find the scholars entry with the users email.
  const response = await notion.databases.query({
    database_id: scholarsDatabaseId,
    filter: {
      property: "Email",
      title: {
        equals: email,
      },
    },
    filter_properties: [],
  });

  if (response.results.length == 0) {
    // TODO Add new database entry for this email instead of throwing.
    throw Error(`Cannot find scholar entry for email ${email}`);
  } else if (response.results.length > 1) {
    throw Error(`Multiple scholar entries found for email ${email}`);
  }

  const scholarId = response.results[0].id;

  // Cache the associated scholarId.
  await cache.set(`scholarId:${userId}`, scholarId);

  return scholarId;
}

/**
 * Retrieves the associated userId for a given scholarId.
 *
 * This method is needed to match scholar entries from notion with the appropriate slack user id.
 * The current implementation uses the email address to match users across slack and notion, but this should be
 * transparent to the caller.
 * Because a given scholarId:userId pair is expected to not change, the result is cached and used when called again.
 *
 * @param scholarId The id of a scholar entry from notion.
 * @returns The id of the associated slack user.
 */
export async function getUserIdFromScholarId(
  scholarId: string
): Promise<string> {
  // Check if the associated userId is cached.
  const cachedUserId = await cache.get<string>(`userId:${scholarId}`);
  if (cachedUserId != null) {
    return cachedUserId;
  }

  // Get the email for the scholar.
  const email = await getEmailForScholar(scholarId);
  if (email == null) {
    throw Error(`Cannot find email for scholar ${scholarId}`);
  }

  try {
    // Find the slack user by its email.
    const response = await slack.client.users.lookupByEmail({ email: email });
    const userId = response.user!.id!;

    // Cache the associated userId.
    await cache.set(`userId:${scholarId}`, userId);

    return userId;
  } catch (e) {
    throw Error(`Cannot find user with email ${email}`);
  }
}

/**
 * Retrieves the user object for a given id.
 *
 * @param userId The id of the slack user.
 * @returns The user object.
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    let response = await slack.client.users.info({ user: userId });
    return response.user ?? null;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieves the email of a given slack user.
 * @param userId The id of the slack user.
 * @returns The email of the slack user.
 */
async function getEmailForUser(userId: string): Promise<string | null> {
  try {
    let response = await slack.client.users.info({ user: userId });
    return response?.user?.profile?.email ?? null;
  } catch (e) {
    console.log(`Cannot find slack user with id ${userId}`, e);
    return null;
  }
}

/**
 * Retrieves the email property of a scholar entry in notion.
 * @param scholarId The id of the scholar entry.
 * @returns The email property of that scholar entry.
 */
async function getEmailForScholar(scholarId: string): Promise<string | null> {
  try {
    const response = (await notion.pages.retrieve({
      page_id: scholarId,
    })) as ScholarRow;
    return response.properties.Email.email;
  } catch (e) {
    console.log(`Cannot find scholar entry with id ${scholarId}`, e);
    return null;
  }
}
