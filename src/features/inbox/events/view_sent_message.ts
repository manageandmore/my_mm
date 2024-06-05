import { ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { SentInboxEntry, loadSentInboxEntries } from "../data";
import { getChannelById } from "../../../slack";
import { deleteSentInboxEntry } from "../data";
import { getOutboxModal } from "../views/outbox_modal";

export const viewSentMessageAction = "view_sent_message";
export const deleteSentMessageAction = "delete_sent_message";

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

  await slack.client.views.update({
    view_id: payload.view?.root_view_id ?? undefined,
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

/**
 * Deletes the sent message from the outbox.
 */
slack.action(deleteSentMessageAction, async (request) => {
  const payload = request.payload;
  const entry = JSON.parse((payload.actions[0] as ButtonAction).value);
  console.log("Payload", payload);

  await deleteSentInboxEntry(payload.user.id, entry);

  await slack.client.views.update({
    view_id: payload.view?.root_view_id ?? undefined,
    view: getOutboxModal(await loadSentInboxEntries(payload.user.id)),
  });
});
