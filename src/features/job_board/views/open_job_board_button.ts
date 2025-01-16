import { AnyHomeTabBlock, Button } from "slack-edge";
import { openJobBoardAction } from "../events/open_job_board";

export function getJobBoardSection(): AnyHomeTabBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Job Board",
      }
    },
    {
      type: "context",
      elements: [{
        type: "mrkdwn",
        text: "Discover the latest job offers posted by *My MM* community, or share your own opportunities."
      }]
    },
    {
      type: "actions",
      elements: [
        getOpenJobBoardButton(),
      ],
    },
  ]
}

export function getOpenJobBoardButton(): Button {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text: "💼 Open Job Board",
      emoji: true,
    },
    action_id: openJobBoardAction,
  };
}
