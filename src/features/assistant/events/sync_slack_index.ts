import { SyncChannelInfo, SyncChannelOptions, loadSlackChannels } from "../data/load_channels";
import { TaskOptions, Task } from "../../common/task_utils";

export const syncSlackTask: Task<SyncChannelInfo, SyncChannelOptions & TaskOptions> = {
  name: "sync slack",
  run: loadSlackChannels,
  display(data) {
    return [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Completed loading ${data.messages} messages from channel #${data.channel}`,
      },
    }];
  }
}