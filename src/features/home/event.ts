import { queryCommunityCredits } from "../community_credits/query";
import { queryUserProfile } from "../profile/query";
import { slack } from "../../slack";
import { getHomeView } from "./view";
import { getEmailForUser } from "../profile/user";

/**
 * Handle the app_home_opened event by updating the users home view with the current data.
 * 
 * The event fires each time a user opens the apps home page in slack.
 * The handler will query notion for the current user data and update the slack view accordingly.
 */
 slack.event("app_home_opened", async (request) => {
  const event = request.payload;

  const email = await getEmailForUser(event.user)

  if (email == null) {
    return
  }

  const [
    profile, 
    communityCredits
  ] = await Promise.all([
    queryUserProfile(email),
    queryCommunityCredits(email)
  ]);
  
  await slack.client.views.publish({
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
