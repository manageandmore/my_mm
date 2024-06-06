import {
  AnyMessageBlock,
  AnyRichTextBlockElement,
  ButtonAction,
} from "slack-edge";
import { getAnnouncementCreatorModal } from "../views/announcement";
import { slack } from "../../../slack";
import { cache } from "../../common/cache";
import { hash } from "../../../utils";

export const createAnnouncementAction = "create_announcement_action";

slack.action(createAnnouncementAction, async (request) => {
  const payload = request.payload;

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getAnnouncementCreatorModal(),
  });
});

export const previewAnnouncementCallback = "preview_announcement_callback";

/**
 * Sends back the created announcement when the user submits the announcement creator modal.
 */
slack.viewSubmission(
  previewAnnouncementCallback,
  async (request) => {
    return {
      response_action: "clear",
    };
  },
  async (request) => {
    const payload = request.payload;

    const state = payload.view.state.values;

    const channel = state.channel.channel.selected_conversation;
    const message = (state.message.message as any).rich_text_value
      .elements as AnyRichTextBlockElement[];

    const announcementId = `announcement:${hash(message)}`;
    await cache.set(announcementId, message);

    await slack.client.chat.postMessage({
      channel: payload.user.id,
      text: "Here is your announcement.",
      blocks: [
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Here is your announcement for channel <#${channel}>:`,
            },
          ],
        },
        {
          type: "rich_text",
          elements: message,
        },
        {
          type: "actions",
          block_id: sendAnnouncementAction,
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Send",
              },
              action_id: sendAnnouncementAction,
              value: JSON.stringify({ channel, announcementId }),
              style: "primary",
            },
          ],
        },
      ],
    });
  }
);

const sendAnnouncementAction = "send_announcement_action";

/**
 * Sends the announcement to the target channel.
 */
slack.action(sendAnnouncementAction, async (request) => {
  var value = (request.payload.actions[0] as ButtonAction).value;
  if (value == null) {
    return;
  }

  var { channel, announcementId } = JSON.parse(value);
  const message = await cache.get<AnyRichTextBlockElement[]>(announcementId);

  if (message == null) {
    return;
  }

  // Send the announcement.
  await slack.client.chat.postMessage({
    channel: channel,
    text: "📢 New announcement from @MyMM",
    blocks: [
      {
        type: "rich_text",
        elements: message,
      },
    ],
  });

  // Update the users preview message to prevent repeated sending.
  await request.context.respond!({
    replace_original: true,
    text: `Announcement sent to channel <#${channel}>`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Announcement sent to channel <#${channel}>.`,
        },
      },
    ],
  });
});
