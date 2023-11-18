import {
  BlockObjectRequest,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { notion } from "../../../notion";
import { notionEnv } from "../../../constants";

const contentCalendarDatabaseId =
  notionEnv == "production"
    ? "e028412a13ed432eb35b42eebe0c4864"
    : "f41ee9c232f547b18dca33ec40d727bf";

type ContentCalendarOptions = {
  title: string;
  date: string;
  channels: string[];
  content: BlockObjectRequest[];
};

export async function addPostToContentCalendar(
  options: ContentCalendarOptions
): Promise<PageObjectResponse> {
  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: contentCalendarDatabaseId,
    },
    properties: {
      Title: {
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
      Channels: {
        type: "multi_select",
        multi_select: options.channels.map((c) => ({
          name: c,
        })),
      },
    },
    children: options.content,
  });
  return response as PageObjectResponse;
}
