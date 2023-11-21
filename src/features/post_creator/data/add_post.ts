import {
  BlockObjectRequest,
  GetDatabaseResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { DatabaseRow, Property, notion } from "../../../notion";
import { notionEnv } from "../../../constants";
import { queryScholarProfile } from "../../profile/query";
import { Prop } from "../../../utils";
import { getScholarIdFromUserId } from "../../common/id_utils";

const contentCalendarDatabaseId =
  notionEnv == "production"
    ? "e028412a13ed432eb35b42eebe0c4864"
    : "f41ee9c232f547b18dca33ec40d727bf";

type ContentCalendarOptions = {
  title: string;
  date: string;
  channels: string[];
  ips: string[];
  user: { id: string; name: string };
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
    ips: channelProp.multi_select.options.map((o) => o.name),
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
        people: [...(personId ? [{ id: personId }] : [])],
      },
      Status: {
        type: "status",
        status: {
          name: "Not started",
        },
      },
    },
    children: options.content,
  });
  return response as PageObjectResponse;
}
