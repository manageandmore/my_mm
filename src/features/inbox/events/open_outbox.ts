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

    // Insert test data
    outbox_messages.push({
      message: {
        ts: "12345",
        channel: "C0694MW7XJN",
      },
      description: "This is a test message",
      actions: [
        {
          label: "✅  Done",
          style: "primary",
          action_id: "message_done",
        },
        {
          label: "🗑️ Dismiss",
          style: "danger",
          action_id: "message_dismissed",
        },
      ],
      recipientIds: ["U06020CBKFH"],
      deadline: "2024-06-04T03:05:00.000Z",
      resolutions: {
        U06020CBKFH: {
          action: {
            label: "✅  Done",
            style: "primary",
            action_id: "message_done",
          },
          timestamp: "2024-06-03T03:05:00.000Z",
        },
      },
    });
    // End test data

    const view = await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getOutboxModal(outbox_messages),
    });
  }
);
