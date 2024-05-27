import { AnyModalBlock } from "slack-edge";
import { loadWebsite } from "../data/load_website";
import { Task } from "../../common/utils";

export const syncWebsite: Task = async (update, done, error) => {
  await update([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "♻️ Refreshing website pages...",
      },
    },
  ]);

  let pages: { page: string; status: string }[] = [];

  const reportToBlocks = () => [
    ...pages.map<AnyModalBlock>((r) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Page ${r.page}: ${r.status}`,
      },
    })),
  ];

  try {
    await loadWebsite(async (page, status) => {
      pages.push({ page, status });
      await update(reportToBlocks());
    });

    await done(reportToBlocks());
  } catch (e) {
    await error([
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚫 Error refreshing website: ${e}`,
        },
      },
    ]);
  }
};
