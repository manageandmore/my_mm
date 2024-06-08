import { AnyModalBlock } from "slack-edge";
import { SentInboxEntry } from "../data";
import { getChannelById } from "../../../slack";
import { deleteSentMessageAction } from "../events/view_sent_message";
import { getResponseCountByAction } from "../events/view_sent_message";

export async function getViewSentMessageModal(
  entry: SentInboxEntry
): Promise<AnyModalBlock[]> {
  let blocks: AnyModalBlock[] = [];

  if (entry.message.ts != "") {
    const messageLink = `https://slack.com/archives/${
      entry.message.channel
    }/p${entry.message.ts.replace(".", "")}`;

    const channelName = await getChannelById(entry.message.channel);
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${messageLink}|Original message>\n\n*Channel posted:* ${channelName}`,
      },
    });
  }

  const actionCounts = getResponseCountByAction(entry); // Replace [entry] with the actual array of SentInboxEntry

  let actionCountsText = "";
  for (const { action, count } of actionCounts) {
    actionCountsText += `\n${action}: ${count}`;
  }

  blocks = blocks.concat([
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
    {
      type: "divider",
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Delete",
          },
          style: "danger",
          action_id: deleteSentMessageAction,
          value: JSON.stringify(entry),
          confirm: {
            title: {
              type: "plain_text",
              text: "Are you sure?",
            },
            text: {
              type: "mrkdwn",
              text: "Are you sure you want to proceed?",
            },
            confirm: {
              type: "plain_text",
              text: "Yes",
            },
            deny: {
              type: "plain_text",
              text: "No",
            },
          },
        },
      ],
    },
  ]);
  return blocks;
}
