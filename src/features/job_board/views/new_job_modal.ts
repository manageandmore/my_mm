import { ModalView } from "slack-edge";
import { newJobBoardItemCallback } from "../events/new_job";

/**
 * Constructs the modal for adding a new job offers to the job board.
 *
 * @returns The modal view.
 */
export function getNewJobModal(): ModalView {
  return {
    type: "modal",
    callback_id: newJobBoardItemCallback,
    title: {
      type: "plain_text",
      text: "💼 New Job Offer",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Add a new job offer for *My MM*. Please ensure all fields are filled out correctly.",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "title",
        label: {
          type: "plain_text",
          text: "Job Title",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "title",
          multiline: false,
          min_length: 10,
          max_length: 100,
          focus_on_load: true,
        },
      },
      {
        type: "input",
        block_id: "description",
        label: {
          type: "plain_text",
          text: "Job Description",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
          min_length: 20,
          max_length: 200,
          placeholder: {
            type: "plain_text",
            text: "Write a brief description of the job...",
          }
        },
      },
      {
        type: "input",
        block_id: "company",
        label: {
          type: "plain_text",
          text: "Company",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "company",
          multiline: false,
          min_length: 3,
          max_length: 50,
        },
      },
      {
        type: "input",
        block_id: "contactEmail",
        label: {
          type: "plain_text",
          text: "Contact Email",
          emoji: true,
        },
        optional: true,
        element: {
          type: "email_text_input",
          action_id: "contactEmail",
          placeholder: {
            type: "plain_text",
            text: "contact@example.com",
          },
        },
      },
      {
        type: "input",
        block_id: "websiteLink",
        label: {
          type: "plain_text",
          text: "Website Link",
          emoji: true,
        },
        optional: true,
        element: {
          type: "url_text_input",
          action_id: "websiteLink",
          placeholder: {
            type: "plain_text",
            text: "https://www.companywebsite.com",
          },
        },
      },
      {
        type: "input",
        block_id: "applicationDeadline",
        label: {
          type: "plain_text",
          text: "Application Deadline",
          emoji: true,
        },
        optional: true,
        element: {
          type: "datepicker",
          action_id: "applicationDeadline",
          placeholder: {
            type: "plain_text",
            text: "Select a date",
          },
        },
      },
      {
        type: "input",
        block_id: "startDate",
        label: {
          type: "plain_text",
          text: "Start Date",
          emoji: true,
        },
        optional: true,
        element: {
          type: "datepicker",
          action_id: "startDate",
          placeholder: {
            type: "plain_text",
            text: "Select a date",
          },
        },
      },
      {
        type: "input",
        block_id: "jobType",
        label: {
          type: "plain_text",
          text: "Job Type",
          emoji: true,
        },
        element: {
          type: "static_select",
          action_id: "jobType",
          options: [
            {
              text: {
                type: "plain_text",
                text: "Full-time",
              },
              value: "full_time",
            },
            {
              text: {
                type: "plain_text",
                text: "Part-time",
              },
              value: "part_time",
            },
            {
              text: {
                type: "plain_text",
                text: "Working Student",
              },
              value: "working_student",
            },
            {
              text: {
                type: "plain_text",
                text: "Internship",
              },
              value: "internship",
            },
            {
              text: {
                type: "plain_text",
                text: "Freelance",
              },
              value: "freelance",
            },
            {
              text: {
                type: "plain_text",
                text: "Other",
              },
              value: "other",
            }
          ],
        },
      },
    ],
  };
}
