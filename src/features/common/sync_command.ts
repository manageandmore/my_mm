import { SlackAppEnv, SlackRequestWithRespond, SlashCommand } from "slack-edge";
import { slack } from "../../slack";
import { features } from "./feature_flags";
import { syncAssistantIndex } from "../assistant/events/sync_assistant";

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
    command: "assistant",
    help: "🧠 Sync the assistant index from notion.",
    run: syncAssistantIndex,
  },
  {
    command: "flags",
    help: "⛳️ Sync all feature flags from notion.",
    run: features.sync.bind(features),
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

    let subcommand = subcommands.find((c) => c.command == payload.text);
    if (subcommand != null) {
      await subcommand.run(request);
    } else {
      request.context.respond({
        response_type: "ephemeral",
        text: `Cannot find subcommand "${payload.text}".`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `Cannot find subcommand "${payload.text}". Supported options are:\n` +
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
