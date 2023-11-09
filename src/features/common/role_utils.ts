import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Prop } from "../../features";
import { notion } from "../../notion";
import { ScholarRow } from "../profile/query";
import { getScholarIdFromUserId } from "./id_utils";

export async function getRolesForUser(userId: string): Promise<string[]> {
  try {
    const scholarId = await getScholarIdFromUserId(userId);

    const response = (await notion.pages.retrieve({
      page_id: scholarId,
      //filter_properties: ["Roles"],
    })) as PageObjectResponse & {
      properties: Pick<Prop<ScholarRow, "properties">, "Roles">;
    };

    return response.properties.Roles.multi_select.map((s) => s.name);
  } catch (_) {
    return [];
  }
}
