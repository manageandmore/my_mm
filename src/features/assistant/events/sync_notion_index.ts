import { AnyMessageBlock } from "slack-edge";
import { ReportInfo, loadNotionPages } from "../data/load_pages";
import { SyncCommandRequest } from "../../common/sync_command";

export async function syncNotionIndex(request: SyncCommandRequest) {
  await request.context.respond({
    response_type: "ephemeral",
    text: "♻️ Syncing assistant index...",
  });

  let reports: ReportInfo[] = [];

  try {
    await loadNotionPages(async (report) => {
      reports.push(report);
    });
  } catch (e) {
    await request.context.respond({
      response_type: "ephemeral",
      text: `🚫 Error syncing assistant index: ${e}`,
    });
    return;
  }

  await request.context.respond({
    response_type: "ephemeral",
    replace_original: true,
    text: "✅ Finished syncing assistant index.",
    blocks: [
      ...reports.map<AnyMessageBlock>((report) =>
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
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "✅ Finished syncing assistant index.",
          emoji: true,
        },
      },
    ],
  });
}
