import { notionEnv } from "../../../constants";
import { DatabaseRow, notion, Property } from "../../../notion";
import { timeSince } from "../../common/time_utils";

/** The id of the job board database in notion. */
export const jobBoardDatabaseId =
  notionEnv == "production"
    ? "15a02ddfbf4e806594edfe5019f3b2a7"
    : "15664f4c3340803db6bed32afa40a853";

/**
 * Type definition for a row in the Job Board database.
 */
type JobBoardRow = DatabaseRow<{
  ID: Property<"unique_id">;
  Title: Property<"title">;
  Description: Property<"rich_text">;
  "Created at": Property<"created_time">;
  "Company Name": Property<"rich_text">;
  "Job Location": Property<"rich_text">;
  "Contact Email": Property<"email">;
  "Application Deadline": Property<"date">;
  "Website Link": Property<"url">;
  "Job Type": Property<"rich_text">;
  "Start Date": Property<"date">;
}>;

/**
 * Interface for a job board item.
 */
export interface JobBoardItem {
  id: string;
  title: string;
  jobDescription: string;
  timeSinceCreated: string;
  company: string;
  contactEmail: string | null;
  websiteLink: string | null;
  startDate: Date | null;
  jobType: string;
}

/**
 * Queries all items from the job board database sorted by creation time.
 *
 * @returns A list of job board items.
 */
export async function queryJobBoardItems( filters?: { jobType?: string; company?: string; startDate?: Date } ): Promise<JobBoardItem[]> {

  const response = await notion.databases.query({
    database_id: jobBoardDatabaseId,
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });

  let items: JobBoardItem[] = [];

  for (let row of response.results as JobBoardRow[]) {
    items.push({
      id: row.id,
      title: row.properties.Title.title[0].plain_text,
      jobDescription: row.properties.Description.rich_text[0].plain_text,
      timeSinceCreated: timeSince(row.created_time),
      company: row.properties["Company Name"].rich_text[0].plain_text,
      contactEmail: row.properties["Contact Email"].email,
      websiteLink: row.properties["Website Link"].url,
      startDate: row.properties["Start Date"].date ? new Date(row.properties["Start Date"].date.start) : null,
      jobType: row.properties["Job Type"].rich_text[0].plain_text ?? "Other",
    });
  }

  if (filters) {
    return items.filter((item) => {
      const matchesJobType = !filters.jobType || item.jobType === filters.jobType;
      const matchesCompany = !filters.company || item.company === filters.company;
      const matchesStartDate =
          !filters.startDate || (item.startDate && item.startDate >= filters.startDate);

      return matchesJobType && matchesCompany && matchesStartDate;
    });
  }

  return items;
}

// Mock data for testing
const mockItems: JobBoardItem[] = [
  {
    id: "1",
    title: "Software Engineer",
    jobDescription: "Develop and maintain web applications.",
    timeSinceCreated: "2 days",
    company: "TechCorp",
    contactEmail: "hr@techcorp.com",
    websiteLink: "https://techcorp.com/jobs",
    startDate: new Date("2024-12-01"),
    jobType: "Full-time",
  },
  {
    id: "2",
    title: "Marketing Intern",
    jobDescription: "Assist in marketing campaigns and social media management.",
    timeSinceCreated: "5 days",
    company: "Brandify",
    contactEmail: "contact@brandify.com",
    websiteLink: "",
    startDate: null,
    jobType: "Internship",
  },
  {
    id: "3",
    title: "Data Analyst",
    jobDescription: "Analyze business data and generate insights.",
    timeSinceCreated: "1 week",
    company: "DataCo",
    contactEmail: "",
    websiteLink: "https://dataco.com/careers",
    startDate: new Date("2025-01-15"),
    jobType: "Part-time",
  },
  {
    id: "4",
    title: "Graphic Designer",
    jobDescription: "Create visual concepts for branding and marketing campaigns.",
    timeSinceCreated: "3 days",
    company: "DesignHub",
    contactEmail: "jobs@designhub.com",
    websiteLink: "https://designhub.com/careers",
    startDate: new Date("2024-11-25"),
    jobType: "Full-time",
  },
  {
    id: "5",
    title: "Customer Support Specialist",
    jobDescription: "Provide exceptional customer service and resolve support tickets.",
    timeSinceCreated: "1 day",
    company: "SupportCo",
    contactEmail: "careers@supportco.com",
    websiteLink: "",
    startDate: null,
    jobType: "Part-time",
  },
  {
    id: "6",
    title: "Software Development Intern",
    jobDescription: "Assist the engineering team with software development and testing.",
    timeSinceCreated: "2 weeks",
    company: "Innovatech",
    contactEmail: "",
    websiteLink: "https://innovatech.com/internships",
    startDate: new Date("2025-01-01"),
    jobType: "Internship",
  },
  {
    id: "7",
    title: "Marketing Manager",
    jobDescription: "Lead marketing strategy and campaigns for digital and offline channels.",
    timeSinceCreated: "4 days",
    company: "MarketLeader",
    contactEmail: "hr@marketleader.com",
    websiteLink: "https://marketleader.com/jobs",
    startDate: new Date("2024-12-10"),
    jobType: "Full-time",
  },
  {
    id: "8",
    title: "Data Scientist",
    jobDescription: "Analyze complex datasets to provide actionable business insights.",
    timeSinceCreated: "1 week",
    company: "DataInsights",
    contactEmail: "apply@datainsights.com",
    websiteLink: "https://datainsights.com/jobs",
    startDate: null,
    jobType: "Working Student",
  },
  {
    id: "9",
    title: "Freelance Content Writer",
    jobDescription: "Write blog posts, articles, and marketing copy for various clients.",
    timeSinceCreated: "2 days",
    company: "WriteNow Agency",
    contactEmail: "talent@writenow.com",
    websiteLink: "",
    startDate: null,
    jobType: "Other",
  },
];