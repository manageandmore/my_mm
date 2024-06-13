import { BlockAction, ButtonAction } from "slack-edge";
import { slack } from "../../../slack";
import { SentInboxEntry, loadSentInboxEntries } from "../data";
import { deleteSentInboxEntry } from "../data";
import { getOutboxModal, getViewSentMessageModal } from "../views/outbox_modal";
import { showOutboxView } from "./open_outbox";

export const viewSentMessageAction = "view_sent_message";

/**
 * Opens the modal to view the sent message.
 *
 * Displays the message and all available information about it based on JSON value that was sent
 * with the button.
 */
slack.action(viewSentMessageAction, async (request) => {
  const payload = request.payload as BlockAction<ButtonAction>;
  const { messageTs } = JSON.parse(payload.actions[0].value) as { messageTs: string };

  const entries: SentInboxEntry[] = await loadSentInboxEntries(payload.user.id);
  const targetEntry = entries.find((e) => e.message.ts == messageTs);

  if (!targetEntry) {
    return;
  }

  await slack.client.views.update({
    view_id: payload.view?.root_view_id ?? undefined,
    view: await getViewSentMessageModal(targetEntry),
  });
});

export const deleteSentMessageAction = "delete_sent_message";

/**
 * Deletes the sent message from the outbox.
 */
slack.action(deleteSentMessageAction, async (request) => {
  const payload = request.payload as BlockAction<ButtonAction>;
  const { messageTs } = JSON.parse(payload.actions[0].value) as { messageTs: string };
  
  await deleteSentInboxEntry(payload.user.id, messageTs);

  await showOutboxView(payload);
});
