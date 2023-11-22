import { AnyMessageBlock } from "slack-edge";
import { SyncCommandRequest } from "../../common/sync_command";
import { features } from "../../common/feature_flags";
import { SyncChannelInfo, loadSlackChannels } from "../data/load_channels";
import { assistantFeatureFlag } from "..";

export async function syncSlackIndex(request: SyncCommandRequest) {
  await request.context.respond({
    response_type: "ephemeral",
    text: "♻️ Syncing slack index...",
  });

  let reports: SyncChannelInfo[] = [];

  try {
    const channelsTag =
      features.read(assistantFeatureFlag).tags.IndexedChannels;
    const indexedChannels = channelsTag ? channelsTag.split(";") : [];

    await loadSlackChannels(
      indexedChannels,
      request.context.botUserId!,
      async (report) => {
        reports.push(report);
      }
    );
  } catch (e) {
    await request.context.respond({
      response_type: "ephemeral",
      text: `🚫 Error syncing slack index: ${e}`,
    });
    return;
  }

  await request.context.respond({
    response_type: "ephemeral",
    replace_original: true,
    text: "✅ Finished syncing slack index.",
    blocks: [
      ...reports.map<AnyMessageBlock>((report) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Completed loading ${report.messages} messages from channel #${report.channel}`,
        },
      })),
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "✅ Finished syncing slack index.",
          emoji: true,
        },
      },
    ],
  });
}
