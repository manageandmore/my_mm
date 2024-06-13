import { slack } from "../../slack";
import { getHomeErrorView, getHomeView } from "./views/home";
import { querySkillListForHomeView } from "../skill_interface/data/query_skills";
import { getScholarIdFromUserId } from "../common/id_utils";
import { queryCreditsLeaderboard } from "../community_credits/data/query_leaderboard";
import { queryScholarProfile } from "./data/query_profile";
import { loadReceivedInboxEntries } from "../inbox/data";

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

  const [profile, [leaderboard, rank], skillList, inbox] = await Promise.all([
    queryScholarProfile(scholarId),
    queryCreditsLeaderboard(scholarId),
    querySkillListForHomeView(scholarId),
    loadReceivedInboxEntries(userId),
  ]);

  await slack.client.views.publish({
    user_id: userId,
    view: await getHomeView(userId, {
      ...profile,
      rank: rank,
      creditsLeaderboard: leaderboard,
      skillList: skillList,
      inbox: inbox,
    }),
  });
}