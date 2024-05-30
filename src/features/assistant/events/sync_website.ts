import { PageInfo, loadWebsite } from "../data/load_website";
import { Task } from "../../common/task_utils";

export const syncWebsiteTask: Task<PageInfo> = {
  name: "website sync",
  run: loadWebsite,
  display(data) {
    return [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Page ${data.page}: ${data.status}`,
      },
    }];
  }
}