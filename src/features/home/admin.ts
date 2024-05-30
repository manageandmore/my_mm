import {
  AnyHomeTabBlock,
  AnyModalBlock,
  BlockAction,
  BlockElementAction,
  SlackAppEnv,
  SlackRequestWithOptionalRespond,
} from "slack-edge";
import { slack } from "../../slack";
import { syncNotionIndex } from "../assistant/events/sync_notion_index";

import { syncSlackIndex } from "../assistant/events/sync_slack_index";
import { features } from "../common/feature_flags";
import { refreshRoles } from "../common/role_utils";
import { createAnnouncementAction } from "./announcement";
import { checkForRemindersAction } from "../inbox/events/message_response";
import { currentUrl } from "../../constants";

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
            text: "Check Reminders",
            emoji: true,
          },
          action_id: checkForRemindersAction,
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
    await processAdminAction(request, async (_, done) => {
      await features.refresh();

      await done([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "⛳️ Successfully refreshed all feature flags.",
          },
        },
      ]);
    });
  }
);

const refreshUserRolesAction = "refresh_user_roles_action";

slack.action(
  refreshUserRolesAction,
  async (_) => {},
  async (request) => {
    await processAdminAction(request, async (_, done) => {
      await refreshRoles();

      await done([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "👥 Successfully refreshed all user roles.",
          },
        },
      ]);
    });
  }
);

const syncNotionIndexAction = "sync_notion_index_action";

slack.action(
  syncNotionIndexAction,
  async (_) => {},
  async (request) => {
    const view = await slack.client.views.open({
      trigger_id: request.payload.trigger_id,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "🌀 Running",
        },
        blocks: [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "...",
              },
            ],
          },
        ],
      },
    });

    await fetch(`https://${currentUrl}/api/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ viewId: view.view?.id }),
    });
  }
);

const syncSlackMessagesAction = "sync_slack_messages_action";

slack.action(
  syncSlackMessagesAction,
  async (_) => {},
  async (request) => {
    await processAdminAction(request, syncSlackIndex(request));
  }
);

export type AdminModalCallback = (blocks: AnyModalBlock[]) => Promise<void>;

export async function processAdminAction(
  request: AdminActionRequest,
  run: (
    update: AdminModalCallback,
    done: AdminModalCallback,
    error: AdminModalCallback
  ) => Promise<void>
) {
  const view = await slack.client.views.open({
    trigger_id: request.payload.trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "🌀 Running",
      },
      blocks: [
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "...",
            },
          ],
        },
      ],
    },
  });

  const update = (title: string) => async (blocks: AnyModalBlock[]) => {
    await slack.client.views.update({
      view_id: view.view!.id,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: title,
        },
        blocks: blocks,
      },
    });
  };

  await run(update("🌀 Running"), update("✅ Done"), update("❌ Error"));
}
