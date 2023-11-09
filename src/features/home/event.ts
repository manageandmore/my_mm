import { queryScholarProfile } from "../profile/query";
import { slack } from "../../slack";
import { getHomeView } from "./view";
import { features } from "../common/feature_flags";
import { homeFeatureFlag } from ".";
import { queryCreditsLeaderboard } from "../community_credits/query_leaderboard";
import { querySkillList } from "../skill_interface/data/query_skills";
import { timeDisplay } from "../common/time_utils";

/**
 * Handle the app_home_opened event by updating the users home view with the current data.
 *
 * The event fires each time a user opens the apps home page in slack.
 * The handler will query notion for the current user data and update the slack view accordingly.
 */
slack.event("app_home_opened", async (request) => {
  const event = request.payload;

  let homeFeatureEnabled = await features.check(homeFeatureFlag, event.user);

  try {
    if (!homeFeatureEnabled) {
      await setCountdownView(
        event.user,
        features.read(homeFeatureFlag).tags.Countdown || null
      );
      return;
    }

    await updateHomeViewForUser(event.user);
  } catch (e) {
    console.log(e);
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

async function setCountdownView(userId: string, countdown: Date | null) {
  console.log(countdown);
  await slack.client.views.publish({
    user_id: userId,
    view: {
      type: "home",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text:
              countdown != null
                ? `Coming soon.\n${timeDisplay(countdown.toISOString())}`
                : "Nothing here yet.",
          },
        },
      ],
    },
  });
}
