import { HomeTabView } from "slack-edge";

export interface HomeOptions {
  name: string
  status: string
  generation: string
  ip: string
  ep: string
  communityCredits: number
  skills: string[]
}

export function getHomeView(options: HomeOptions): HomeTabView {
  return {
    type: 'home',
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": options.name,
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*:büste_silhouette: Status :*\n${options.status}\n`
          },
          {
            "type": "mrkdwn",
            "text": `*:sanduhr: Generation:*\n${options.generation}`
          },
          {
            "type": "mrkdwn",
            "text": `*:register: Internal Project:*\n${options.ip}`
          },
          {
            "type": "mrkdwn",
            "text": `*:rakete: External Project:*\n${options.ep}`
          },
          {
            "type": "mrkdwn",
            "text": `*:stern: Community Credits:*\n${options.communityCredits}/6`
          },
          {
            "type": "mrkdwn",
            "text": "*:trophäe: Liga:*\n HP Warrior"
          },
          {
            "type": "mrkdwn",
            "text": "*:sonnenbrille: Skills:*"
          }
        ],
        "accessory": {
          "type": "image",
          "image_url": "https://www.befunky.com/images/wp/wp-2013-08-featured1.png?auto=avif,webp&format=jpg&width=500&crop=16:9",
          "alt_text": "calendar thumbnail"
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Barking",
              "emoji": true
            },
            "value": "barking"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Sleeping",
              "emoji": true
            },
            "value": "sleep"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Being cute",
              "emoji": true
            },
            "value": "cute"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Doing Nothing",
              "emoji": true
            },
            "value": "nothing"
          }
        ]
      },
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Community Credits Leaderboard",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": ":krone: *Name*"
          },
          {
            "type": "mrkdwn",
            "text": ":stern: *Points*"
          },
          {
            "type": "mrkdwn",
            "text": "<fakeLink.toUserProfiles.com| Almo>"
          },
          {
            "type": "mrkdwn",
            "text": "13"
          },
          {
            "type": "mrkdwn",
            "text": "<fakeLink.toUserProfiles.com| Kilian>"
          },
          {
            "type": "mrkdwn",
            "text": "3"
          },
          {
            "type": "mrkdwn",
            "text": "<fakeLink.toUserProfiles.com| Samuel>"
          },
          {
            "type": "mrkdwn",
            "text": "0"
          },
          {
            "type": "mrkdwn",
            "text": "<fakeLink.toUserProfiles.com| Liana>"
          },
          {
            "type": "mrkdwn",
            "text": "-1"
          }
        ]
      },
      {
        "type": "divider"
      }
    ]
  };
}