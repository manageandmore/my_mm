import { FileItem } from "slack-edge";
import { slack } from "../../slack";
import { createSocialPostAction } from "./shortcut";

slack.anyMessage(async (request) => {

  const payload = request.payload;

  if (payload.channel_type == 'im') {
    if (payload.subtype == 'file_share') {
      if (payload.files != null && payload.files.length == 1) {
        const file = payload.files![0] as any as FileItem
        if (['jpg', 'jpeg', 'png'].includes(file.filetype)) {
            await slack.client.chat.postMessage({
              channel: payload.channel,
              text: 'What a nice image. Do you want to turn it into a social media post?',
              blocks: [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "What a nice image. ✨\nDo you want to turn it into a social media post?"
                  },
                  "accessory": {
                    "type": "button",
                    "action_id": createSocialPostAction,
                    "text": {
                      "type": "plain_text",
                      "text": "Create Social Media Post",
                      "emoji": true
                    },
                    "style": "primary",
                    "value": file.id,
                  }
                }
              ]
            })
          }
        }
      }
    }
  }
)