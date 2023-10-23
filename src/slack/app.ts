import { SlackApp } from "slack-edge";
import { slackSigningSecret, slackToken } from "../constants";
import { queryCommunityCredits } from "../notion/community_credits";
import { queryUserProfile } from "../notion/profile";
import { openai, systemMessage } from "../openai/openai";
import { getHomeView } from "./home";

export const app = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackToken,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

app.event('app_mention', async (request) => {
  const event = request.payload

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    max_tokens: 200,
    messages: [systemMessage, { role: 'user', content: await event.text }],
  });

  await app.client.chat.postMessage({
    channel: event.channel,
    text: response.choices[0].message.content,
  })
})

app.event('app_home_opened', async (request) => {
  const event = request.payload

  const userResponse = await app.client.users.info({
    user: event.user
  })
  const user = userResponse.user
  const userId = user.profile.email

  const [
    profile, 
    communityCredits
  ] = await Promise.all([
    queryUserProfile(userId),
    queryCommunityCredits(userId)
  ]);
  
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