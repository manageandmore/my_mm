import {
  BlockObjectRequest,
  GetDatabaseResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { notion } from "../../../notion";
import { currentUrl, notionEnv } from "../../../constants";
import { Prop } from "../../../utils";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { queryScholarProfile } from "../../home/data/query_profile";

const contentCalendarDatabaseId =
  notionEnv == "production"
    ? "e028412a13ed432eb35b42eebe0c4864"
    : "f41ee9c232f547b18dca33ec40d727bf";

type ContentCalendarOptions = {
  title: string;
  date: string;
  fileUrl: string;
  channels: string[];
  ips: string[];
  user: { id: string; name: string };
  assignee: string[];
  content: BlockObjectRequest[];
};

type MultiSelectPropertyConfig = Extract<
  Prop<GetDatabaseResponse, "properties">[any],
  { type: "multi_select" }
>;

export async function getContentCalendarInfo() {
  const response = await notion.databases.retrieve({
    database_id: contentCalendarDatabaseId,
  });

  const channelProp = response.properties.Channel as MultiSelectPropertyConfig;
  const ipProp = response.properties.IP as MultiSelectPropertyConfig;

  return {
    channels: channelProp.multi_select.options.map((o) => o.name),
    ips: ipProp.multi_select.options.map((o) => o.name),
  };
}

export async function addPostToContentCalendar(
  options: ContentCalendarOptions
): Promise<PageObjectResponse> {
  let personId: string | undefined = undefined;
  try {
    const scholarId = await getScholarIdFromUserId(options.user.id);
    const profile = await queryScholarProfile(scholarId);
    personId = profile.person;
  } catch (e) {}

  let content = <BlockObjectRequest[]>[
    {
      type: "callout",
      callout: {
        color: "gray_background",
        icon: {
          external: {
            url: `https://${currentUrl}/assets/icon-small.png`,
          },
        },
        rich_text: [
          {
            type: "text",
            text: { content: "Created with " },
            annotations: { italic: true },
          },
          {
            type: "text",
            text: { content: "My MM" },
            annotations: { bold: true, italic: true },
          },
          {
            type: "text",
            text: { content: " by " },
            annotations: { italic: true },
          },
          {
            type: "text",
            text: { content: options.user.name },
            annotations: { bold: true, italic: true },
          },
        ],
      },
    },
    ...options.content,
  ];

  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: contentCalendarDatabaseId,
    },
    properties: {
      title: {
        type: "title",
        title: [
          {
            type: "text",
            text: { content: options.title },
          },
        ],
      },
      Date: {
        type: "date",
        date: {
          start: options.date,
        },
      },
      IP: {
        type: "multi_select",
        multi_select: options.ips.map((c) => ({
          name: c,
        })),
      },
      Channel: {
        type: "multi_select",
        multi_select: options.channels.map((c) => ({
          name: c,
        })),
      },
      "Responsible Person": {
        type: "people",
        people: [
          ...(personId ? [{ id: personId }] : []),
          ...options.assignee.map((id) => ({ id })),
        ],
      },
      Status: {
        type: "status",
        status: {
          name: "Not started",
        },
      },
      "Files & media": {
        type: "files",
        files: [
          {
            external: { url: options.fileUrl },
            name: options.title,
          },
        ],
      },
    },
    children: content,
  });
  return response as PageObjectResponse;
}
