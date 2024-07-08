import { slack } from "../../../slack";
import { deleteSentInboxEntry, loadSentInboxEntries } from "../data";
import { getOutboxModal } from "../views/outbox_modal";
import { SentInboxEntry } from "../data";
import { BlockAction, ButtonAction } from "slack-edge";

export const openOutboxAction = "open_outbox";

/**
 * Opens the outbox modal when the user clicks the 'Outbox' button.
 */
slack.action(
  openOutboxAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload as BlockAction<ButtonAction>;

    await showOutboxView(payload);
  }
);

export const deleteExpiredOutboxMessagesAction =
  "delete_expired_outbox_messages";

/**
 * Deletes all expired outbox messages of a user and updates the outbox view.
 */
slack.action(
  deleteExpiredOutboxMessagesAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload as BlockAction<ButtonAction>;

    const outbox: SentInboxEntry[] = await loadSentInboxEntries(
      payload.user.id
    );

    for (let entry of outbox) {
      // Delete outbox messages that are past the deadline.
      if (entry.deadline && new Date(entry.deadline) < new Date()) {
        await deleteSentInboxEntry(payload.user.id, entry.message.ts);
      }
    }

    await showOutboxView(payload);
  }
);

export async function showOutboxView(
  payload: BlockAction<ButtonAction>
): Promise<void> {
  const outbox: SentInboxEntry[] = await loadSentInboxEntries(payload.user.id);

  const expired = outbox.filter(
    (o) => o.deadline && new Date(o.deadline) < new Date()
  ).length;

  const viewId = payload.view?.root_view_id;

  if (viewId && payload.view?.type != "home") {
    await slack.client.views.update({
      view_id: viewId,
      view: getOutboxModal(outbox, expired),
    });
  } else {
    await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getOutboxModal(outbox, expired),
    });
  }
}
