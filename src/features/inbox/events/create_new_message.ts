import { slack } from "../../../slack";
import { getNewMessageModal } from "../views/new_message_modal";
import {
  CreateInboxEntryOptions,
  InboxAction,
  createInboxEntry,
  loadSentInboxEntries,
} from "../data";
import { getOutboxModal } from "../views/outbox_modal";

export const newMessageAction = "new_outbox_message";

/**
 * Opens the new message modal when the user clicks the 'New message' button.
 */
slack.action(newMessageAction, async (request) => {
  const payload = request.payload;

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: getNewMessageModal(),
  });
});

/**
 * This event is triggered when the user clicks the "Submit" button when creating a new message
 */
slack.viewSubmission(newMessageAction, async (request) => {
  const payload = request.payload;
  const values = payload.view.state.values;
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
    //TODO - Add the rest of the fields
    message: {
      ts: "123465",
      channel: "C0694MW7XJN",
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
