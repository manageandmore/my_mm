import { slack } from "../../../slack";
import { loadSentInboxEntries } from "../data";
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
