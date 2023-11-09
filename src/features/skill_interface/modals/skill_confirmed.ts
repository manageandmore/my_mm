import { ModalView } from "slack-edge";

/**
 * Constructs the modal for confirming the addition of a skill to the skill database.
 *
 * @returns The modal view.
 */
export function getSkillConfirmedModal(): ModalView {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Submission Successful",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Close",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":tada: Your skill has been successfully committed to the skill database. You should be able to see it in your Home view in a few seconds.",
        },
      },
    ],
  };
}
