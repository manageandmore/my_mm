import { ReportInfo, loadNotionPages } from "../data/load_pages";
import { Task } from "../../common/task_utils";

export const syncNotionTask: Task<ReportInfo> = {
  name: "notion sync",
  run: loadNotionPages,
  display(report) {
    if( report.type == "update") {return [
     {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `Completed loading documents for ${report.target} ${report.id}:\n` +
            `-> Skipped ${report.stats.skipped}, Updated ${report.stats.updated}, Added ${report.stats.added}, Removed ${report.stats.removed}`,
        },
      }]; } else { return [
     {
        type: "section",
        text: {
          type: "plain_text",
          text: `Removed ${report.amount} documents for ${report.id}.`,
        },
      }]; }
  }
};