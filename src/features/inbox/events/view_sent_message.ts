import { AnyModalBlock, ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { SentInboxEntry, loadSentInboxEntries } from "../data";
import { getChannelById } from "../../../slack";
import { deleteSentInboxEntry } from "../data";
import { getOutboxModal } from "../views/outbox_modal";
import { getViewSentMessageModal } from "../views/view_sent_message_modal";

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
  //shorten title to 24 characters for modal title
  let title = "";
  if (entry.description.length > 24) {
    title = entry.description.substring(0, 22) + "..";
  } else {
    title = entry.description;
  }

  await slack.client.views.update({
    view_id: payload.view?.root_view_id ?? undefined,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: `${title}`,
      },
      blocks: await getViewSentMessageModal(entry),
    },
  });
});

export function getResponseCountByAction(
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
