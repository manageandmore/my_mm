import { slack } from "../../../slack";
import { deleteSentInboxEntry, loadSentInboxEntries } from "../data";
import { getOutboxModal } from "../views/outbox_modal";
import { SentInboxEntry } from "../data";

export const openOutboxAction = "open_outbox";

/**
 * Opens the outbox modal when the user clicks the 'Outbox' button.
 */
slack.action(
  openOutboxAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    var outbox_messages: SentInboxEntry[] = await loadSentInboxEntries(
      payload.user.id
    );

    let outbox_message: SentInboxEntry;
    //clean up outbox messages that are past the deadline
    for (outbox_message of outbox_messages) {
      if (
        outbox_message.deadline &&
        new Date(outbox_message.deadline) < new Date()
      ) {
        //delete the message from cache
        console.log("Deleting message from cache", outbox_message);
        await deleteSentInboxEntry(payload.user.id, outbox_message);
        //delete the message from the outbox_messages array
        outbox_messages = outbox_messages.filter(
          (message) => message !== outbox_message
        );
      }
    }

    const view = await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getOutboxModal(outbox_messages),
    });
  }
);
