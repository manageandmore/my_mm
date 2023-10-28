import { notion } from "../../notion";
import { slack } from "../../slack";

export async function setScholarID(userId: string, scholarId: string) {
  await slack.client.users.profile.set({
    user: userId,
    profile: JSON.stringify({
      "fields": {
        scholarIdField: {
          "value": scholarId,
          "alt": ""
        }
      }
    })
  })
}

export async function setSlackID(userId: string, scholarId: string) {
  await notion.pages.update({
    page_id: scholarId,
    properties: {
      SlackID: userId
    }
  })
}