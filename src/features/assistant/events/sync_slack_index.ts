import { AnyModalBlock } from "slack-edge";
import { SyncChannelInfo, loadSlackChannels } from "../data/load_channels";
import { AdminActionRequest, AdminModalCallback } from "../../home/admin";
import { indexedChannels } from "../../../constants";

export const syncSlackIndex =
  (request: AdminActionRequest) =>
  async (
    update: AdminModalCallback,
    done: AdminModalCallback,
    error: AdminModalCallback
  ) => {
    await update([
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "♻️ Syncing slack index...",
        },
      },
    ]);

    let reports: SyncChannelInfo[] = [];

    const reportToBlocks = () => [
      ...reports.map<AnyModalBlock>((report) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Completed loading ${report.messages} messages from channel #${report.channel}`,
        },
      })),
    ];

    try {
      await loadSlackChannels(
        indexedChannels,
        request.context.botUserId!,
        async (report) => {
          reports.push(report);
          await update(reportToBlocks());
        }
      );

      await done(reportToBlocks());
    } catch (e) {
      await error([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚫 Error syncing slack index: ${e}`,
          },
        },
      ]);
    }
  };
