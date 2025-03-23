import { AnyModalBlock, Button, ImageElement, ModalView } from "slack-edge";
import { newIdeaFactoryItemAction } from "../events/new_idea";
import { viewIdeaFactoryInNotionAction } from "../events/open_idea_factory";
import { voteIdeaFactoryItemAction } from "../events/vote_idea";
import { ideaFactoryDatabaseId, IdeaFactoryItem } from "../data/query_items";

/** Interface for the data used to hydrate the idea factory modal. */
export interface IdeaFactoryOptions {
  items?: IdeaFactoryItem[];
}

/**
 * Constructs the modal view for the idea factory.
 *
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
export function getIdeaFactoryModal(options: { items: IdeaFactoryItem[]}): ModalView {
  let blocks: AnyModalBlock[];

  if (options.items == null || options.items.length === 0) {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            emoji: true,
            text: "⏳ Loading all your awesome ideas...",
          },
        ],
      },
    ];
  } else {
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Vote on ideas to improve the Manage and More program - or even add your own ideas!",
          },
        ],
      },
      {
        type: "divider",
      },
    ];
    for (let item of options.items) {
      blocks = blocks.concat(getIdeaFactoryItem(item));
    }
    blocks = blocks.concat([
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Idea",
              emoji: true,
            },
            style: "primary",
            action_id: newIdeaFactoryItemAction,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Notion",
              emoji: true,
            },
            url: `https://www.notion.so/${ideaFactoryDatabaseId}`,
            action_id: viewIdeaFactoryInNotionAction,
          },
        ],
      },
    ]);
  }

  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Idea Factory 🏭",
      emoji: true,
    },
    blocks: blocks,
  };
}

function getIdeaFactoryItem(item: IdeaFactoryItem): AnyModalBlock[] {
  return [
    {
      type: "section",
      block_id: item.id,
      text: {
        type: "mrkdwn",
        text: `*${item.title}*\n${item.pitch}`,
      },
      accessory: getVoteButton(item.votedByUser),
    },
    {
      type: "context",
      elements: [
        ...item.voters.map(
          (voter) =>
            ({
              type: "image",
              image_url: voter.imageUrl,
              alt_text: voter.name,
            } as ImageElement)
        ),
        {
          type: "plain_text",
          emoji: true,
          text: `${item.voters.length} vote${
            item.voters.length != 1 ? "s" : ""
          }`,
        },
        {
          type: "plain_text",
          emoji: true,
          text: `∙`,
        },
        {
          type: "plain_text",
          emoji: true,
          text: `Created ${item.timeSinceCreated} ago`,
        },
      ],
    },
  ];
}

function getVoteButton(voted: boolean): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      emoji: true,
      text: voted ? "✅ You Voted" : "🗳️ Vote",
    },
    style: voted ? "primary" : undefined,
    action_id: voteIdeaFactoryItemAction,
    value: `${voted}`,
  };
}
