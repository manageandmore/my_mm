import { slack } from "../../../slack";
import { getNewMessageModal } from "../views/new_message_modal";
import {
  CreateInboxEntryOptions,
  InboxAction,
  createInboxEntry,
} from "../data";
import { ButtonAction, WebhookParams } from "slack-edge";
import { openOutboxAction } from "./open_outbox";

/**
 * This action id can be used to call the modal to create an outbox message
 */
export const newMessageAction = "new_outbox_message";

/**
 * Opens the new message modal when the user clicks the 'New message' button.
 */
slack.action(newMessageAction, async (request) => {
  const payload = request.payload;

  // Get channel and message id from the payload.
  const { channelId, messageTs } = JSON.parse(
    (request.payload.actions[0] as ButtonAction).value
  );

  // Get the message text from the api.
  const response = await slack.client.conversations.history({
    channel: channelId,
    latest: messageTs,
    limit: 1,
    inclusive: true,
  });
  let message = response.messages?.[0].text;
  if (!message) {
    return;
  }

  if (message.length > 200) {
    message = message.substring(0, 197) + "...";
  }

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: await getNewMessageModal(
      channelId,
      messageTs,
      message,
      payload.response_url
    ),
  });
});

/**
 * This event is triggered when the user clicks the "Submit" button when creating a new message
 */
slack.viewSubmission(
  newMessageAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;

    const {
      channelId,
      messageTs,
      updateUrl,
    }: { channelId: string; messageTs: string; updateUrl: string } = JSON.parse(
      payload.view.private_metadata
    );

    const enable_reminders =
      values.options?.options_input_action?.selected_options?.find(
        (option) => option.value === "enable_reminders"
      );

    const notify_on_create =
      values.options?.options_input_action?.selected_options?.find(
        (option) => option.value === "notify_on_create"
      );

    let deadline = values.deadline.deadline_input_action.selected_date_time;

    const description =
      values.message_description.message_description_input.value;

    const actions = [] as InboxAction[];
    const multiselect_data =
      values.multi_select_menu.multi_select_menu_action.selected_options;
    for (const option of multiselect_data ?? []) {
      actions.push(JSON.parse(option.value) as InboxAction);
    }

    let options: CreateInboxEntryOptions = {
      message: {
        ts: messageTs,
        channel: channelId,
        userId: payload.user.id,
      },
      description: description ?? "",
      actions: actions,
      deadline:
        typeof deadline === "number"
          ? new Date(deadline * 1000).toISOString()
          : undefined,
      notifyOnCreate: notify_on_create != null,
      enableReminders: enable_reminders != null,
    };

    await createInboxEntry(options);

    // Update the original ephemeral message.
    await fetch(updateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(<WebhookParams>{
        replace_original: true,
        text: "✅ Successfully added this message to the inbox.",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "✅ Successfully added this message to the inbox.",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "📤 Open Outbox",
                  emoji: true,
                },
                action_id: openOutboxAction,
              },
            ],
          },
        ],
      }),
    });
  }
);
