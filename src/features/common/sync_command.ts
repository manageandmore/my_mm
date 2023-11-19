import { SlackAppEnv, SlackRequestWithRespond, SlashCommand } from "slack-edge";
import { slack } from "../../slack";
import { features } from "./feature_flags";
import { syncNotionIndex } from "../assistant/events/sync_notion_index";
import { refreshRoles } from "./role_utils";

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
