import { queryScholarProfile } from "../profile/query";
import { slack } from "../../slack";
import { getHomeErrorView, getHomeView } from "./views/home";
import { features } from "../common/feature_flags";
import { queryCreditsLeaderboard } from "../community_credits/query_leaderboard";
import { querySkillListForHomeView } from "../skill_interface/data/query_skills";
import { timeDisplay } from "../common/time_utils";
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
    await updateHomeViewForUser(event.user);
  } catch (e) {
    console.log(e);
    await slack.client.views.publish({
      user_id: event.user,
      view: getHomeErrorView((e as Error).message),
    });
    return;
  }
});

export async function updateHomeViewForUser(userId: string) {
  const scholarId = await getScholarIdFromUserId(userId);

  const [profile, [leaderboard, rank], skillList] = await Promise.all([
    queryScholarProfile(scholarId),
    queryCreditsLeaderboard(scholarId),
    querySkillListForHomeView(scholarId),
  ]);

  await slack.client.views.publish({
    user_id: userId,
    view: await getHomeView(userId, {
      name: profile.name,
      generation: profile.generation,
      status: profile.status,
      ip: profile.ip,
      ep: profile.ep,
      communityCredits: profile.credits,
      url: profile.url,
      rank: rank,
      creditsLeaderboard: leaderboard,
      skillList: skillList,
    }),
  });
}