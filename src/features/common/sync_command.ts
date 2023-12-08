import {
  ButtonAction,
  SlackAppEnv,
  SlackRequestWithRespond,
  SlashCommand,
} from "slack-edge";
import { slack } from "../../slack";
import { features } from "./feature_flags";
import { syncNotionIndex } from "../assistant/events/sync_notion_index";
import { refreshRoles } from "./role_utils";
import { syncSlackIndex } from "../assistant/events/sync_slack_index";

export type SyncCommandRequest = SlackRequestWithRespond<
  SlackAppEnv,
  SlashCommand
>;

const syncFeatureFlag = features.register({
  label: "Sync",
  description: "Enables the '/sync' command.",
});

type SubCommand = {
  command: string;
  help: string;
  run: (request: SyncCommandRequest) => Promise<any>;
};

const subcommands: SubCommand[] = [
  {
    command: "help",
    help: "Displays this message.",
    run: showHelp,
  },
  {
    command: "notion-index",
    help: "🧠 Sync the notion index for the mm assistant.",
    run: syncNotionIndex,
  },
  {
    command: "feature-flags",
    help: "⛳️ Sync all feature flags from notion.",
    run: features.sync.bind(features),
  },
  {
    command: "roles",
    help: "👥 Refreshes the roles for all users.",
    run: refreshRoles,
  },
  {
    command: "slack-index",
    help: "💬 Sync all messages in the indexed slack channels from the past 90 days for the mm assistant.",
    run: syncSlackIndex,
  },
  {
    command: "announcement",
    help: "📢 Send an announcement message to a channel as the app.",
    run: sendAnnouncement,
  },
];

slack.command(
  "/sync",
  async (request) => {},
  async (request) => {
    const payload = request.payload;

    if (!(await features.check(syncFeatureFlag, payload.user_id))) {
      await request.context.respond({
        response_type: "ephemeral",
        text: `❌ You don't have access to this command.`,
      });
      return;
    }

    var args = payload.text.split(" ");
    var cmd = args[0];

    let subcommand = subcommands.find((c) => c.command == cmd);
    if (subcommand != null) {
      await subcommand.run(request);
    } else {
      await request.context.respond({
        response_type: "ephemeral",
        text: `Cannot find subcommand "${cmd}".`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `Cannot find subcommand "${cmd}". Supported options are:\n` +
                `${subcommands
                  .map((c) => ` - *${c.command}*: ${c.help}`)
                  .join("\n")}`,
            },
          },
        ],
      });
    }
  }
);

async function showHelp(request: SyncCommandRequest) {
  await request.context.respond({
    response_type: "ephemeral",
    text: `Supported subcommands are:`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `Usage: '/sync <subcommand>'. Supported subcommands are:\n` +
            `${subcommands
              .map((c) => ` - *${c.command}*: ${c.help}`)
              .join("\n")}`,
        },
      },
    ],
  });
}

async function sendAnnouncement(request: SyncCommandRequest) {
  var args = validateAnnouncementArgs(request.payload.text);

  if (args == null) {
    await request.context.respond({
      response_type: "ephemeral",
      text: `Usage:\n/sync announcement #<channel>\n<message>`,
    });
    return;
  }

  var { channel, message } = args;

  console.log("ANNOUNCEMENT", channel, message);

  await request.context.respond({
    response_type: "ephemeral",
    text: `Channel: <#${channel.id}|${channel.name}>\nMessage: ${message}`,
    blocks: [
      {
        type: "section",
        block_id: sendAnnouncementAction,
        text: {
          type: "mrkdwn",
          text: `Announcement for channel <#${channel.id}|${channel.name}>:\n\n${message}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Send",
          },
          action_id: sendAnnouncementAction,
          value: JSON.stringify({ channel, message }),
        },
      },
    ],
  });
}

function validateAnnouncementArgs(text: string) {
  var lines = text.split("\n");
  var args = lines[0].split(" ");

  if (args.length < 2 || lines.length < 2) {
    return null;
  }

  var channel = args[1].trim();
  var message = lines.slice(1).join("\n").trim();

  if (message.length == 0) {
    return null;
  }

  var match = /^<#(?<id>[^|]*)\|(?<name>[^>]*)>$/.exec(channel);
  if (match == null) {
    return null;
  }

  message = message.replace(
    /<([^|]*)(\|[^>]*)?>\s&lt;([^\s]*)&gt;/,
    (_, link, __, label) => `<${link}|${label}>`
  );

  return { channel: match.groups as { id: string; name: string }, message };
}

const sendAnnouncementAction = "send_announcement";

slack.action(sendAnnouncementAction, async (request) => {
  var value = (request.payload.actions[0] as ButtonAction).value;
  if (value == null) {
    return;
  }
  var { channel, message } = JSON.parse(value);

  await slack.client.chat.postMessage({
    channel: channel.id,
    text: message,
  });
});
