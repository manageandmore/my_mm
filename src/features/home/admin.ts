import {
  AnyHomeTabBlock,
  BlockAction,
  BlockElementAction,
  SlackAppEnv,
  SlackRequestWithOptionalRespond,
} from "slack-edge";
import { slack } from "../../slack";
import { features } from "../common/feature_flags";
import { refreshRoles } from "../common/role_utils";
import { checkForRemindersAction } from "../inbox/events/message_response";
import { openTaskModal, performTask, triggerTask } from "../common/task_utils";
import { assistantFeatureFlag } from "../assistant";
import { createAnnouncementAction } from "../announcement/events/announcement";
import { syncNotionTask } from "../assistant/loaders/load_pages";
import { syncSlackTask } from "../assistant/loaders/load_channels";
import { syncWebsiteTask } from "../assistant/loaders/load_website";
import { openOutboxAction } from "../inbox/events/open_outbox";

export type AdminActionRequest = SlackRequestWithOptionalRespond<
  SlackAppEnv,
  BlockAction<BlockElementAction>
>;

const adminFeatureFlag = features.register({
  label: "Admin",
  description: "Enables the admin control settings on the home view.",
});

export async function getAdminSection(
  userId: string
): Promise<AnyHomeTabBlock[]> {
  if (!(await features.check(adminFeatureFlag, userId))) {
    return [];
  }

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Admin Controls",
        emoji: true,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📢 Create Announcement",
            emoji: true,
          },
          action_id: createAnnouncementAction,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "⛳️ Refresh Feature Flags",
            emoji: true,
          },
          action_id: refreshFeatureFlagsAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "👥 Refresh User Roles",
            emoji: true,
          },
          action_id: refreshUserRolesAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🧠 Refresh Notion Index",
            emoji: true,
          },
          action_id: syncNotionIndexAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "💬 Sync Slack Messages",
            emoji: true,
          },
          action_id: syncSlackMessagesAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🌐 Refresh Website Content",
            emoji: true,
          },
          action_id: syncWebsiteAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "⏰ Check Reminders",
            emoji: true,
          },
          action_id: checkForRemindersAction,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "open outbox",
            emoji: true,
          },
          action_id: openOutboxAction,
        },
      ],
    },
    {
      type: "divider",
    },
  ];
}

const refreshFeatureFlagsAction = "refresh_feature_flags_action";

slack.action(
  refreshFeatureFlagsAction,
  async (_) => {},
  async (request) => {
    var viewId = await openTaskModal(request.payload.trigger_id);
    await performTask(
      {
        name: "refresh feature flags",
        run: async (_, log) => {
          await features.refresh();
          await log("done");
        },
        display: (_) => [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "⛳️ Successfully refreshed all feature flags.",
            },
          },
        ],
      },
      { viewId }
    );
  }
);

const refreshUserRolesAction = "refresh_user_roles_action";

slack.action(
  refreshUserRolesAction,
  async (_) => {},
  async (request) => {
    var viewId = await openTaskModal(request.payload.trigger_id);
    await performTask(
      {
        name: "refresh roles",
        run: async (_, log) => {
          await refreshRoles();
          await log("done");
        },
        display: (_) => [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "👥 Successfully refreshed all user roles.",
            },
          },
        ],
      },
      { viewId }
    );
  }
);

const syncNotionIndexAction = "sync_notion_index_action";

slack.action(
  syncNotionIndexAction,
  async (_) => {},
  async (request) => {
    const viewId = await openTaskModal(request.payload.trigger_id);
    await triggerTask(syncNotionTask, { viewId });
  }
);

const syncSlackMessagesAction = "sync_slack_messages_action";

slack.action(
  syncSlackMessagesAction,
  async (_) => {},
  async (request) => {
    const channelsTag =
      features.read(assistantFeatureFlag).tags.IndexedChannels;
    const indexedChannels = channelsTag ? channelsTag.split(";") : [];

    var viewId = await openTaskModal(request.payload.trigger_id);
    await triggerTask(syncSlackTask, {
      viewId: viewId,
      channels: indexedChannels,
      botUserId: request.context.botUserId!,
    });
  }
);

const syncWebsiteAction = "sync_website_action";

slack.action(
  syncWebsiteAction,
  async (_) => {},
  async (request) => {
    var viewId = await openTaskModal(request.payload.trigger_id);
    await triggerTask(syncWebsiteTask, { viewId });
  }
);
