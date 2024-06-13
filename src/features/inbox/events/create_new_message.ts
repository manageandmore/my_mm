import { slack } from "../../../slack";
import { getNewMessageModal } from "../views/new_message_modal";
import {
  CreateInboxEntryOptions,
  InboxAction,
  createInboxEntry,
  loadSentInboxEntries,
} from "../data";
import { getOutboxModal } from "../views/outbox_modal";
import { ButtonAction } from "slack-edge";

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
  const message = response.messages?.[0].text;
  if (!message) {
    return;
  }

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: await getNewMessageModal(channelId, messageTs, message),
  });
});

/**
 * This event is triggered when the user clicks the "Submit" button when creating a new message
 */
slack.viewSubmission(newMessageAction, async (request) => {
  const payload = request.payload;
  const values = payload.view.state.values;

  const { channelId, messageTs }: { channelId: string; messageTs: string } =
    JSON.parse(payload.view.private_metadata);

  const enable_reminders =
    values.options.options_input_action.selected_options?.find(
      (option) => option.value === "enable_reminders"
    );

  const notify_on_create =
    values.options.options_input_action.selected_options?.find(
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

  await slack.client.chat.postEphemeral({
    channel: channelId,
    user: payload.user.id,
    text: "Successfully added this message to the inbox.",
  });

  //update initial view
  await slack.client.views.update({
    view_id: payload.view.root_view_id!,
    view: getOutboxModal(await loadSentInboxEntries(payload.user.id)),
  });
});
