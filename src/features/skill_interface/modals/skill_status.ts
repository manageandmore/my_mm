import { ModalView } from "slack-edge";

/**
 * Constructs the modal for confirming the addition of a skill to the skill database.
 *
 * @returns The modal view.
 */
export function getSkillEditStatusModal(editSuccessful: boolean): ModalView {
  let statusText: string;
  let statusTitle: string;
  if (!editSuccessful) {
    statusText = "An error occurred while editing your skills. Please try again later.";
    statusTitle = "Error";
  } else {
    statusText = "Your skill has been successfully edited. :Tada: You should be able to see it in your Home view in a few seconds.";
    statusTitle = "Success";
  }

  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: statusTitle,
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
          text: statusText,
        },
      },
    ],
  };
}
