import { SlackApp } from "slack-edge";
import { slackSigningSecret, slackToken } from "../constants";
import { queryCommunityCredits } from "../notion/community_credits";
import { queryUserProfile } from "../notion/profile";
import { openai, systemMessage } from "../openai/openai";

import { getHomeView } from "./home";

/**
 * The api client used to access the slack api and handle events.
 */
export const app = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackToken,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

/**
 * Handle the app_mention event by prompting chatgpt to respond to the users message.
 * 
 * The event fires each time a user mentions the slack app in a message.
 * The handler will prompt chatgpt with the users message and post its response as a new message in the same channel.
 */
app.event("app_mention", async (request) => {
  const event = request.payload;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 200,
    messages: [systemMessage, { role: "user", content: event.text }],
  });

  await app.client.chat.postMessage({
    channel: event.channel,
    text: response.choices[0].message.content!,
  });
});

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
