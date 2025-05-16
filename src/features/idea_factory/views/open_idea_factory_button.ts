import { AnyHomeTabBlock, Button } from "slack-edge";
import { openIdeaFactoryAction, viewIdeaFactoryInNotionAction } from "../events/open_idea_factory";
import { ideaFactoryDatabaseId } from "../data/query_items";

export function getIdeaFactorySection(): AnyHomeTabBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Idea Factory",
      }
    },
    {
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "Vote on ideas to improve the Manage and More program - or even add your own ideas!"
      }]
    },
    {
      type: "actions",
      elements: [
        getOpenIdeaFactoryButton(),
        getOpenIdeaFactoryInNotionButton(),
      ],
    },
  ]
}

export function getOpenIdeaFactoryButton(): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "🏭 Open Idea Factory",
      emoji: true,
    },
    action_id: openIdeaFactoryAction,
  };
}

export function getOpenIdeaFactoryInNotionButton(): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "Open All Ideas in Notion",
      emoji: true,
    },
    url: `https://www.notion.so/${ideaFactoryDatabaseId}`,
    action_id: viewIdeaFactoryInNotionAction,
  };
}