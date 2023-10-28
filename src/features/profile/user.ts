import { slack } from "../../slack"

export async function getEmailForUser(userId: string): Promise<string | undefined> {
  let userResponse
  try {
    userResponse = await slack.client.users.info({
      user: userId
    })
  } catch (e) {
    console.log("ERROR", e)
    return
  }

  const user = userResponse.user!
  return user.profile!.email!
}