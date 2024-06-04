import { ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { SentInboxEntry, loadSentInboxEntries } from "../data";
import { getChannelById } from "../../../slack";

export const viewSentMessageAction = "view_sent_message";

/**
 * Opens the modal to view the sent message.
 *
 * Displays the message and all available information about it based on JSON value that was sent
 * with the button.
 */

slack.action(viewSentMessageAction, async (request) => {
  const payload = request.payload;
  const action = payload.actions[0] as ButtonAction;
  const entry = JSON.parse(action.value) as SentInboxEntry;

  const messageLink = `https://slack.com/archives/${
    entry.message.channel
  }/p${entry.message.ts.replace(".", "")}`;

  const channelName = await getChannelById(entry.message.channel);
  const actionCounts = getResponseCountByAction(entry); // Replace [entry] with the actual array of SentInboxEntry

  let actionCountsText = "";
  for (const { action, count } of actionCounts) {
    actionCountsText += `\n${action}: ${count}`;
  }

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: `${entry.description}`,
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${messageLink}|Original message>`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Channel posted:*\n${channelName}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Deadline:*\n${
              entry.deadline
                ? new Date(entry.deadline).toLocaleString()
                : "No deadline"
            }`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Responded:*\n${actionCountsText}\n
            *Overall: ${Object.keys(entry.resolutions).length} of ${
              entry.recipientIds.length
            }*`,
          },
        },
        //TODO: add more information about how many responded with what action
        {
          type: "divider",
        },
      ],
    },
  });
});

function getResponseCountByAction(
  entry: SentInboxEntry
): { action: string; count: number }[] {
  const actionCounts: { [action: string]: number } = {};

  for (const resolution of Object.values(entry.resolutions)) {
    const label = resolution.action.label;
    if (actionCounts[label]) {
      actionCounts[label]++;
    } else {
      actionCounts[label] = 1;
    }
  }

  return Object.entries(actionCounts).map(([action, count]) => ({
    action,
    count,
  }));
}
