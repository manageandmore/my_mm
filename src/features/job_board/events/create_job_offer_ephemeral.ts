import { jobOfferChannels } from "../../../constants";
import { anyMessage, getPublicChannels, slack } from "../../../slack";
import { newJobBoardItemFromEphemeralAction} from "./new_job";

/**
 * Listens to new messages and posts an ephemeral message to the user to create a job offer.
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

    if (channelName == null) {
        return;
    }
    const isIndexed = jobOfferChannels.includes(channelName);
    if (!isIndexed) {
        if (!payload.text.toLowerCase().includes("-create job offer")) {
            return;
        }
        if (payload.blocks) {
            return;
        }
        for (const blockType of payload.blocks!) {
            if (blockType.type !== "rich_text") {
                console.log("block type not rich text");
                return;
            }
        }
        // Check that message has user
        if (payload.user) {
            await responseEphemeral(payload.channel, payload.user, payload.ts);
            return;
        }
    }
    await responseEphemeral(payload.channel, payload.user, payload.ts);
});

async function responseEphemeral(channel: string, user: string, ts: string) {
    // Send an ephemeral message with an interactive button
    await slack.client.chat.postEphemeral({
        channel: channel,
        user: user,
        text: "💼 Would you like to create a job offer for the MyMM homepage?",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "💼 Would you like to create a job offer for the MyMM homepage?",
                },
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: "Job offers on the MyMM homepage provide a great overview over currently available offerings that are available to Manage and more scholars.",
                    },
                ],
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Create Job Offer",
                            emoji: true,
                        },
                        value: JSON.stringify({
                            channelId: channel,
                            messageTs: ts,
                        }),
                        action_id: newJobBoardItemFromEphemeralAction,
                    },
                ],
            },
        ],
    });
}

const createJobOfferShortcut = "create_job_offer";

slack.messageShortcut(createJobOfferShortcut, async (request) => {
    const payload = request.payload;
    try {
        const response = await slack.client.conversations.info({
            channel: payload.channel.id,
        });
        const channel = response.channel?.id as string;
        const ts = payload.message.ts;
        await responseEphemeral(channel, payload.user.id, ts);
    } catch (error) {
        await request.context.respond({
            response_type: "ephemeral",
            text: "Failed to create job offer.\nERROR: " + error + " ",
        });
    }
});
