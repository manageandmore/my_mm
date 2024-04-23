import { AnyMessageBlock, AnyModalBlock } from "slack-edge";
import { ReportInfo, loadNotionPages } from "../data/load_pages";
import { AdminActionRequest, AdminModalCallback } from "../../home/admin";

export async function syncNotionIndex(
  update: AdminModalCallback,
  done: AdminModalCallback,
  error: AdminModalCallback
) {
  await update([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "♻️ Syncing notion index...",
      },
    },
  ]);

  let reports: ReportInfo[] = [];

  const reportToBlocks = () => [
    ...reports.map<AnyModalBlock>((report) =>
      report.type == "update"
        ? {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `Completed loading documents for ${report.target} ${report.id}:\n` +
                `-> Skipped ${report.stats.skipped}, Updated ${report.stats.updated}, Added ${report.stats.added}, Removed ${report.stats.removed}`,
            },
          }
        : {
            type: "section",
            text: {
              type: "plain_text",
              text: `Removed ${report.amount} documents for ${report.id}.`,
            },
          }
    ),
  ];

  try {
    await loadNotionPages(async (report) => {
      reports.push(report);
      await update(reportToBlocks());
    });

    await done(reportToBlocks());
  } catch (e) {
    await error([
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚫 Error syncing notion index: ${e}`,
        },
      },
    ]);
  }
}
