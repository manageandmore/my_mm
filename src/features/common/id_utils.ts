
import { slack } from "../../slack"
import { notion, scholarsDatabaseId } from "../../notion";
import { ScholarRow } from "../profile/query";
import { User } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import { kv } from "@vercel/kv";

export async function getScholarIdFromUserId(userId: string): Promise<string> {
  const cachedScholarId = await kv.get<string>(`scholarId:${userId}`)
  if (cachedScholarId != null) {
    return cachedScholarId
  }

  const email = await getEmailForUser(userId)

  if (email == null) {
    throw Error(`Cannot find email for user ${userId}`)
  }
  
  const response = await notion.databases.query({
    database_id: scholarsDatabaseId,
    filter: {
      property: 'Email',
      title: {
        equals: email,
      },
    },
    filter_properties: []
  })

  if (response.results.length == 0) {
    // TODO Add new database entry instead
    throw Error(`Cannot find scholar entry for email ${email}`)
  } else if (response.results.length > 1) {
    throw Error(`Multiple scholar entries found for email ${email}`)
  }

  const scholarId = response.results[0].id

  await kv.set(`scholarId:${userId}`, scholarId)

  return scholarId
}

export async function getUserFromScholarId(scholarId: string): Promise<User> {
  const cachedUserId = await kv.get<string>(`userId:${scholarId}`)
  if (cachedUserId != null) {
    try {
      const response = await slack.client.users.info({user: cachedUserId})
      return response.user!
    } catch (e) {
      await kv.del(`userId:${scholarId}`)
    }
  }

  const email = await getEmailForScholar(scholarId)

  if (email == null) {
    throw Error(`Cannot find email for scholar ${scholarId}`)
  }

  try {
    const response = await slack.client.users.lookupByEmail({ email: email })

    await kv.set(`userId:${scholarId}`, response.user!.id)

    return response.user!
  } catch (e) {
    throw Error(`Cannot find user with email ${email}`)
  }
}

export async function getUserById(userId: string): Promise<User | undefined> {
  try {
    let response = await slack.client.users.info({ user: userId })
    return response.user
  } catch (e) {
    // noop
  }
}

async function getEmailForUser(userId: string): Promise<string | undefined> {
  try {
    let response = await slack.client.users.info({user: userId})
    return response?.user?.profile?.email
  } catch (e) {
    console.log("ERROR", e)
  }
}

async function getEmailForScholar(scholarId: string): Promise<string | null> {
  const response = await notion.pages.retrieve({
    page_id: scholarId
  }) as ScholarRow

  return response.properties.Email.email
}