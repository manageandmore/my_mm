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
  //get channel and ts from the payload
  var value = (request.payload.actions[0] as ButtonAction).value;
  const { channelId, messageTs, messageDescription } = JSON.parse(value);

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: await getNewMessageModal(channelId, messageTs, messageDescription),
  });
});

/**
 * This event is triggered when the user clicks the "Submit" button when creating a new message
 */
slack.viewSubmission(newMessageAction, async (request) => {
  const payload = request.payload;
  const values = payload.view.state.values;

  let privateMetadata: { channelId?: string; ts?: string } = {};
  if (payload.view.private_metadata) {
    try {
      privateMetadata = JSON.parse(payload.view.private_metadata);
    } catch (error) {
      console.error("Error parsing private_metadata:", error);
    }
  }
  const channelId: string | undefined = privateMetadata.channelId;
  const ts: string | undefined = privateMetadata.ts;
  console.log("values", values);

  const notify_on_create =
    values.Options.options_input_action.selected_options?.find(
      (option) => option.value === "notify_on_create"
    );
  const enable_reminders =
    values.Options.options_input_action.selected_options?.find(
      (option) => option.value === "enable_reminders"
    );

  let deadline =
    values.message_date.message_date_picker.selected_date_time ?? "";
  console.log("deadline", deadline);
  if (typeof deadline === "number") {
    deadline = deadline * 1000;
    deadline = new Date(deadline).toISOString();
  }

  const description =
    values.message_description.message_description_input.value;

  const actions = [] as InboxAction[];
  const multiselect_data =
    values.multi_select_menu.multi_select_menu_action.selected_options;
  for (const option of multiselect_data ?? []) {
    actions.push(JSON.parse(option.value) as InboxAction);
  }

  let options: CreateInboxEntryOptions = {
    //TODO - Add the rest of whthe fields
    message: {
      ts: ts ?? "",
      channel: channelId ?? "",
      userId: payload.user.id,
    },
    description: description as string | "", // Assign empty string instead of undefined
    actions: actions,
    deadline:
      enable_reminders != null ? (deadline as unknown as string) : undefined, // Assign undefined instead of empty string

    notifyOnCreate: notify_on_create != null,
    enableReminders: enable_reminders != null,
  };
  //console.log("options", options);
  await createInboxEntry(options);

  //update initial view
  await slack.client.views.update({
    view_id: payload.view.root_view_id!,
    view: getOutboxModal(await loadSentInboxEntries(payload.user.id)),
  });
});
