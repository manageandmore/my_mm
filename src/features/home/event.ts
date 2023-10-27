import { queryCommunityCredits } from "../community_credits/query";
import { queryUserProfile } from "../profile/query";
import { app } from "../app";
import { getHomeView } from "./view";

/**
 * Handle the app_home_opened event by updating the users home view with the current data.
 * 
 * The event fires each time a user opens the apps home page in slack.
 * The handler will query notion for the current user data and update the slack view accordingly.
 */
 app.event("app_home_opened", async (request) => {
  const event = request.payload;
  console.log("REQUEST USER")
  let userResponse
  try {
  userResponse = await app.client.users.info({
    user: event.user
  })
  console.log("USER", userResponse)
} catch (e) {
  console.log("ERROR", e)
  return
}
  const user = userResponse.user!
  const userId = user.profile!.email!

  console.log("USER", user)
  const [
    profile, 
    communityCredits
  ] = await Promise.all([
    queryUserProfile(userId),
    queryCommunityCredits(userId)
  ]);
  
  console.log("PROFILE USER", profile, communityCredits)
  await app.client.views.publish({
    user_id: event.user,
    view: getHomeView({
      name: profile.name,
      generation: profile.generation,
      status: profile.status,
      ip: profile.ip,
      ep: profile.ep,
      communityCredits: communityCredits,
      skills: []
    })
  })
})
