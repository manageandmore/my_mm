import { queryCreditsLeaderboard, queryScholarProfile, querySkillList } from "../profile/query";
import { slack } from "../../slack";
import { getHomeView } from "./view";

/**
 * Handle the app_home_opened event by updating the users home view with the current data.
 *
 * The event fires each time a user opens the apps home page in slack.
 * The handler will query notion for the current user data and update the slack view accordingly.
 */
slack.event("app_home_opened", async (request) => {
  const event = request.payload;
  console.log(event);
  try {
    await updateHomeViewForUser(event.user);
  } catch (e) {
    //console.log(e);
    // TODO Show error view to user
    return;
  }
});

export async function updateHomeViewForUser(userId: string) {
  try {
    const profile = await queryScholarProfile(userId);
    const leaderboard = await queryCreditsLeaderboard();
    const skillList = await querySkillList(userId);

    await slack.client.views.publish({
      user_id: userId,
      view: getHomeView({
        name: profile.name,
        generation: profile.generation,
        status: profile.status,
        ip: profile.ip,
        ep: profile.ep,
        communityCredits: profile.credits,
        skills: [],
        creditsLeaderboard: leaderboard,
        skillList: skillList,
      }),
    });
  } catch (e) {
    console.log(e);
    // TODO Show error view to user
  }
}
