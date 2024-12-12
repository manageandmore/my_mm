import { notion } from "../../../notion";
import { jobBoardDatabaseId } from "./query_jobs";

/**
 * Interface for a new job board item.
 */
export interface NewJobBoardItem {
  title: string;
  jobDescription: string;
  applicationDeadline: Date | null;
  company: string;
  contactEmail: string | null;
  websiteLink: string | null;
  startDate: Date | null;
  jobType: string;
  createdBy: string;
}

/**
 * Creates a new entry in the job board database.
 *
 * @param item The data for the new entry.
 */
export async function addJobBoardItem(item: NewJobBoardItem) {
  await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: jobBoardDatabaseId,
    },
    properties: {
      Title: {
        type: "title",
        title: [{ type: "text", text: { content: item.title } }],
      },
      Description: {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.jobDescription } }],
      },
      "Company Name": {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.company } }],
      },
      "Job Location": {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.company } }],
      },
      "Contact Email": {
        type: "email",
        email: item.contactEmail
      },
      "Application Deadline": {
        type: "date",
        date: item.applicationDeadline ? {start: item.applicationDeadline?.toISOString()} : null
      },
      "Website Link": {
        type: "url",
        url: item.websiteLink,
      },
      "Job Type": {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.jobType } }],
      },
      "Start Date": {
        type: "date",
        date: item.startDate ? {start: item.startDate?.toISOString()} : null
      },
      "Created By": {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: item.createdBy } }],
      },
    },
  });
}
