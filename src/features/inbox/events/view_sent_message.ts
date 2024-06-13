import { ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { SentInboxEntry, loadSentInboxEntries } from "../data";
import { deleteSentInboxEntry } from "../data";
import { getOutboxModal, getViewSentMessageModal } from "../views/outbox_modal";

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

  await slack.client.views.update({
    view_id: payload.view?.root_view_id ?? undefined,
    view: await getViewSentMessageModal(entry),
  });
});

export function getResponseCountByAction(
  entry: SentInboxEntry
): { [action: string]: number } {
  const actionCounts: { [action: string]: number } = {};

  for (const resolution of Object.values(entry.resolutions)) {
    const id = resolution.action.action_id;
    actionCounts[id] = (actionCounts[id] ?? 0) + 1;
  }

  return actionCounts;
}

export const deleteSentMessageAction = "delete_sent_message";

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
