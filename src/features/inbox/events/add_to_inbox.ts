import { anyMessage, getPublicChannels, slack } from "../../../slack";
import {newMessageAction} from "./create_new_message";

/**
 * Listens to new messages and posts an ephemeral message to the user to add the message to the inbox.
 */
anyMessage(async (request) => {
    const payload = request.payload;

    if (payload.subtype === "bot_message") {
        return;
    }

    if (payload.text.includes(`<@${request.context.botUserId}>`)) {
        return;
    }

    const channels = await getPublicChannels();
    const channelName = channels.get(payload.channel)?.name;

    console.log("channelName", channelName);

    var isIndexed = channelName === "general" || channelName === "active";

    // just for testing on staging
    isIndexed = isIndexed  || channelName === "allgemein"

    if (!isIndexed) {
        return;
    }

    // Send an ephemeral message with an interactive button
    await slack.client.chat.postEphemeral({
        channel: payload.channel,
        user: payload.user,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Would you like to add this to the inbox of all users in the channel?"
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Add to Inbox",
                            emoji: true
                        },
                        value: JSON.stringify({
                            channelId: payload.channel,
                            messageTs: payload.ts,
                            messageDescription: payload.text
                        }),
                        action_id: newMessageAction
                    }
                ]
            }
        ],
        text: "Add to inbox?" // Fallback text for notifications
    });
});


