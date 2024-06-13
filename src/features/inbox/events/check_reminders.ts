import { Task } from "../../common/task_utils";
import { checkAndTriggerOverdueInboxReminders } from "../data";

export const checkInboxRemindersTask: Task = {
  name: "check reminders",
  async run(_, log) {
    await checkAndTriggerOverdueInboxReminders();
  },
  display(_) {
    return [];
  },
};
