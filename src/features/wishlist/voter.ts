import { User } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import { slack } from "../../slack";

export interface Voter {
  id?: string
  notionId: string
  name: string
  imageUrl: string
}

export async function getVoterByEmail(email: string): Promise<Voter> {
  let user: User | undefined
  try {
    let response = await slack.client.users.lookupByEmail({ email: email })
    user = response.user
  } catch (e) {
    // noop
  }

  return getVoterForUser(user);
}

export async function getVoterById(id: string): Promise<Voter> {
  let user: User | undefined
  try {
    let response = await slack.client.users.info({ user: id })
    user = response.user
  } catch (e) {
    // noop
  }

  return getVoterForUser(user);
}

function getVoterForUser(user: User | undefined): Voter {
  if (user != null) {
    var imageUrl = getImageUrlForUser(user)
    return {
      id: user.id,
      notionId: '',
      name: user.real_name ?? user.name ?? 'Unknown',
      imageUrl
    }
  } else {
    return {
      notionId: '',
      name: 'Unknown',
      imageUrl: '_'
    }
  }
}

function getImageUrlForUser(user: User | undefined): string {
  var profile = user?.profile;
  return profile?.image_24
    ?? profile?.image_32
    ?? profile?.image_48
    ?? profile?.image_72
    ?? profile?.image_192
    ?? profile?.image_512
    ?? profile?.image_original
    ?? '_'
}

