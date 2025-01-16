import { AnyModalBlock, Button, ModalView } from "slack-edge";
import { applyFiltersAction, cancelFilterAction, submitFilterAction } from "../events/open_job_board";
import { newJobBoardItemAction } from "../events/new_job";
import { jobBoardDatabaseId, JobBoardItem } from "../data/query_jobs";

/** Interface for the data used to hydrate the job board modal. */
export interface JobBoardOptions {
  items?: JobBoardItem[];
  jobTypes?: string[];  // Add jobTypes to options
  companies?: string[];  // Add companies to options
}

/**
 * Constructs the modal view for the job board.
 *
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
export function getJobBoardModal(options: JobBoardOptions & { filterMode?: boolean }): ModalView {
  let blocks: AnyModalBlock[];

  if (options.filterMode) {
    console.log("Rendering filter UI...");

    // Extract unique job types and companies dynamically from items
    const jobTypes = Array.from(new Set((options.items || []).map((item) => item.jobType))).filter(Boolean);
    const companies = Array.from(new Set((options.items || []).map((item) => item.company))).filter(Boolean);

    // Log the available job types and companies to ensure they are correctly extracted
    console.log("Companies available:", companies);
    console.log("Job types available:", jobTypes);

    // If jobTypes or companies are empty, we can provide default options
    if (jobTypes.length === 0) {
      jobTypes.push("No available job types");
    }
    if (companies.length === 0) {
      companies.push("No available companies");
    }

    blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "🔍 *Filter Job Offers*",
        },
      },
      {
        type: "input",
        block_id: "job_type_filter",
        label: {
          type: "plain_text",
          text: "Filter by Job Type",
        },
        element: {
          type: "static_select",
          action_id: "job_type_select",
          placeholder: {
            type: "plain_text",
            text: "Select a job type",
          },
          options: jobTypes.map((jobType) => ({
            text: {
              type: "plain_text",
              text: jobType,
            },
            value: jobType,
          })),
        },
      },
      {
        type: "input",
        block_id: "company_filter",
        label: {
          type: "plain_text",
          text: "Filter by Company",
        },
        element: {
          type: "static_select",
          action_id: "company_select",
          placeholder: {
            type: "plain_text",
            text: "Select a company",
          },
          options: companies.map((company) => ({
            text: {
              type: "plain_text",
              text: company,
            },
            value: company,
          })),
        },
      },
      {
        type: "input",
        block_id: "start_date_filter",
        label: {
          type: "plain_text",
          text: "Filter by Earliest Start Date",
        },
        element: {
          type: "datepicker",
          action_id: "start_date_select",
          placeholder: {
            type: "plain_text",
            text: "Select a start date",
          },
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Apply Filters",
            },
            style: "primary",
            action_id: submitFilterAction,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Remove All Filters",
            },
            action_id: cancelFilterAction,
          },
        ],
      },
    ];
  } else if (options.items == null || options.items.length === 0) {
    // Show fallback message if no items are available
    blocks = [
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            emoji: true,
            text: "⏳ No job postings available at the moment.",
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
            text: "Discover the latest job offers posted by *My MM* community, or share your own opportunities.",
          },
        ],
      },
      {
        type: "divider",
      },
      ...options.items.flatMap((item) => getJobBoardItem(item)),  // Correctly flatten job blocks
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Job Offer",
              emoji: true,
            },
            style: "primary",
            action_id: newJobBoardItemAction,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Filter Job Offers",
              emoji: true,
            },
            action_id: applyFiltersAction,
          },
        ],
      },
    ];
  }

  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: options.filterMode ? "Filter Job Offers" : "💼 Job Board",
      emoji: true,
    },
    blocks: blocks,
    submit: options.filterMode
      ? {
          type: "plain_text",
          text: "Apply",
        }
      : undefined, // Submit button only in filter mode
    close: {
      type: "plain_text",
      text: "Close",
    },
  };
}

function getJobBoardItem(item: JobBoardItem): AnyModalBlock[] {
  // Format variables for display
  const formattedStartDate = item.startDate ? item.startDate.toLocaleDateString() : "ASAP";
  const formattedWebsiteLink = item.websiteLink ? `<${item.websiteLink}|Website>` : "N/A";
  const formattedContactEmail = item.contactEmail || "N/A";
  return [
    {
      type: "section",
      block_id: item.id,
      text: {
        type: "mrkdwn",
        text: `*${item.company} | ${item.title} (${item.jobType})*\n${item.jobDescription}`,
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "plain_text",
          emoji: true,
          text: `Start Date: ${formattedStartDate}`
        },
        {
          type: "mrkdwn",
          text: `Contact Email: ${formattedContactEmail}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Website: ${formattedWebsiteLink}`,
        },
        {
          type: "plain_text",
          emoji: true,
          text: `Created: ${item.timeSinceCreated} ago`,
        },
      ],
    },
    {
      type: "divider",
    },
  ];
}