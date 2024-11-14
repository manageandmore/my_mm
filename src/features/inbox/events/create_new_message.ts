import { slack } from "../../../slack";
import {
  getNewMessageModal,
  getCreateCalendarEventModal,
} from "../views/new_message_modal";
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
 * This action id can be used to call the modal to add an calendar event to the message
 */
export const addCalendarEntryAction = "add_calendar_entry";

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

  // Get bot user id
  const botUserId = (await slack.client.auth.test()).user_id;
  // remove app mention and command from message
  message = message
    .replace(`<@${botUserId}>`, "")
    .replace(/-add to inbox/, "")
    .replace(/-Add to inbox/, "");

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
      calendarEventUrl,
    }: {
      channelId: string;
      messageTs: string;
      updateUrl: string;
      calendarEventUrl: string | undefined;
    } = JSON.parse(payload.view.private_metadata);

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
      deadline: typeof deadline === "number" ? deadline : undefined,
      notifyOnCreate: notify_on_create != null,
      enableReminders: enable_reminders != null,
    };
    if (calendarEventUrl) {
      options.calendarUrl = calendarEventUrl;
    }

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

/**
 * Functions gets triggered if Add calendar event button is added
 */
slack.viewSubmission(
  addCalendarEntryAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;
    const { channelId, messageTs, description, updateUrl, view_id } =
      JSON.parse(payload.view.private_metadata);
    const eventName = encodeURIComponent(
      values.event_name.event_name_input.value || ""
    );
    let startInput =
      values.event_start_time.start_time_input.selected_date_time;
    const startTime =
      typeof startInput === "number"
        ? encodeURIComponent(new Date(startInput * 1000).toISOString())
        : undefined;

    let endInput = values.event_end_time.end_time_input.selected_date_time;
    const endTime =
      typeof endInput === "number"
        ? encodeURIComponent(new Date(endInput * 1000).toISOString())
        : undefined;

    let timezone = encodeURIComponent("Europe/Berlin"); // replace with your desired timezone

    // Create string for api webserver api call
    let calendarUrl = `https://calndr.link/d/event/?service=google&start=${startTime}&end=${endTime}&title=${eventName}&timezone=${timezone}`;
    console.log(calendarUrl);

    await slack.client.views.update({
      view_id: view_id,
      view: await getNewMessageModal(
        channelId,
        messageTs,
        description,
        updateUrl,
        calendarUrl
      ),
    });
  }
);

slack.action(addCalendarEntryAction, async (request) => {
  const payload = request.payload;

  // Get channel and message id from the payload.
  const { channelId, messageTs, description, updateUrl } = JSON.parse(
    (request.payload.actions[0] as ButtonAction).value
  );

  const view_id = payload.view?.id || "";

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: await getCreateCalendarEventModal(
      channelId,
      messageTs,
      description,
      updateUrl,
      view_id
    ),
  });
});
