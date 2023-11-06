import { queryScholarProfile } from "../profile/query";
import { slack } from "../../slack";
import { getHomeView } from "./view";
import { getScholarIdFromUserId } from "../common/id_utils";

/**
 * Handle the app_home_opened event by updating the users home view with the current data.
 * 
 * The event fires each time a user opens the apps home page in slack.
 * The handler will query notion for the current user data and update the slack view accordingly.
 */
 slack.event("app_home_opened", async (request) => {
  const event = request.payload;

  try {
    const scholarId = await getScholarIdFromUserId(event.user)

    const profile = await queryScholarProfile(scholarId)
    
    await slack.client.views.publish({
      user_id: event.user,
      view: getHomeView({
        name: profile.name,
        generation: profile.generation,
        status: profile.status,
        ip: profile.ip,
        ep: profile.ep,
        communityCredits: profile.credits,
        skills: []
      })
    })
  } catch (e) {
    console.log(e)
    // TODO Show error view to user
    return
  }
})
