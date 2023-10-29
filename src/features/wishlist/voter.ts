import { User } from "slack-web-api-client/dist/client/generated-response/UsersLookupByEmailResponse";
import { slack } from "../../slack";
import { getScholarIdFromUserId, getUserById, getUserFromScholarId } from "../common/id_utils";

export interface Voter {
  id?: string
  scholarId: string
  name: string
  imageUrl: string
}

export async function getVoterByScholarId(scholarId: string): Promise<Voter> {
  try {
    const user = await getUserFromScholarId(scholarId);
    return getVoterForUser(user, scholarId);
  } catch (e) {
    return {
      scholarId: scholarId,
      name: 'Unknown',
      imageUrl: '_'
    }
  }
}

export async function getVoterById(userId: string): Promise<Voter> {
  const [
    scholarId,
    user
  ] = await Promise.all([
    getScholarIdFromUserId(userId),
    getUserById(userId)
  ])

  if (user != null) {
    return getVoterForUser(user, scholarId)
  } else {
    return {
      scholarId: scholarId,
      name: 'Unknown',
      imageUrl: '_'
    }
  }
}

function getVoterForUser(user: User, scholarId: string): Voter {
  var imageUrl = getImageUrlForUser(user)
  return {
    id: user.id,
    scholarId: scholarId,
    name: user.real_name ?? user.name ?? 'Unknown',
    imageUrl: imageUrl,
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

