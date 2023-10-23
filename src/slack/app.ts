import {
  DatabaseObjectResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { SlackApp } from "slack-edge";
import { slackSigningSecret, slackToken } from "../constants";
import { notion, pointsDatabaseId } from "../notion/client";
import { openai, systemMessage } from "../openai/openai";

export const app = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: slackSigningSecret,
    SLACK_BOT_TOKEN: slackToken,
    SLACK_APP_TOKEN: "",
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

app.event("app_mention", async (request) => {
  const event = request.payload;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 200,
    messages: [systemMessage, { role: "user", content: event.text }],
  });

  await app.client.chat.postMessage({
    channel: event.channel,
    text: response.choices[0].message.content,
  });
});

app.event("app_home_opened", async (request) => {
  const event = request.payload;

  const userResponse = await app.client.users.info({
    user: event.user,
  });

  const user = userResponse.user;

  const name = user?.real_name ?? user?.name;
  const email = user?.profile?.email;

  let dbResponse: QueryDatabaseResponse | undefined = undefined;

  if (email) {
    dbResponse = await notion.databases.query({
      database_id: pointsDatabaseId,
      filter: {
        property: "Name",
        title: {
          equals: user?.profile?.email!,
        },
      },
    });
  }

  console.log("notion", dbResponse);

  let points = 0;

  if (dbResponse && dbResponse.results.length > 0) {
    const row = dbResponse.results[0] as PageObjectResponse;
    var prop = row.properties.Points;
    if (prop.type == "number") {
      points = prop.number ?? points;
    }
  }

  await app.client.views.publish({
    user_id: event.user,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Hello ${name}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Your helper points: *${points}*`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `You are beautiful!`,
          },
        },
      ],
    },
  });
});
