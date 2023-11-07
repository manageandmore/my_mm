import {
  MentionRichTextItemResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { Property, notion } from "../../../notion";
import { getVectorStore } from "../ai/chain";
import { notionToken } from "../../../constants";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/dist/document";
import { QueryResult } from "@vercel/postgres";
import { VercelPostgres } from "langchain/vectorstores/vercel_postgres";
import { NotionAPILoader } from "./notion_loader";
import yaml from "js-yaml";

const assistantIndexDatabaseId = "f6004560d0b54e3384a42a2f4d59687b";

/**
 * Type definition for a row in the Assistant Index database.
 */
export type AssistantIndexRow = PageObjectResponse & {
  properties: {
    Name: Property<"title">;
    Type: Property<"select">;
  };
};

var _m: MentionRichTextItemResponse;
type IndexTarget = Extract<typeof _m.mention, { type: "page" | "database" }>;

export async function loadNotionPages() {
  const vectorStore = await getVectorStore();

  const response = await notion.databases.query({
    database_id: assistantIndexDatabaseId,
  });

  let existingTimestamps = await queryNotionDocuments(vectorStore);

  for (let row of response.results as AssistantIndexRow[]) {
    let name = row.properties.Name;
    let target: IndexTarget | null = null;

    for (var part of name.title) {
      if (part.type != "mention") {
        continue;
      }
      let mention = part.mention;
      if (mention.type == "page" || mention.type == "database") {
        target = mention;
        break;
      }
    }

    if (target == null) {
      continue;
    }

    let notionId = target.type == "page" ? target.page.id : target.database.id;
    let existingLastEdited = existingTimestamps.get(notionId);
    let isExisting = existingLastEdited != null;

    if (isExisting) {
      existingTimestamps.delete(notionId);
    }

    if (target.type == "page") {
      let docs = await loadPage(notionId, existingLastEdited);
      if (docs.length == 0) {
        console.log(`Skipping update for ${notionId}.`);
        continue;
      }

      await deleteNotionDocuments(vectorStore, notionId);
      await vectorStore.addDocuments(docs);

      console.log(
        `${isExisting ? "Updated" : "Added"} ${
          docs.length
        } documents for page ${notionId}`
      );
    } else {
      let docs = await loadDatabase(notionId);

      await deleteNotionDocuments(vectorStore, notionId);
      await vectorStore.addDocuments(docs);

      console.log(
        `${isExisting ? "Updated" : "Added"} ${
          docs.length
        } documents for database ${notionId}`
      );
    }
  }

  for (let notionId of existingTimestamps.keys()) {
    console.log(`Removing documents for ${notionId}`);
    await deleteNotionDocuments(vectorStore, notionId);
  }
}

async function queryNotionDocuments(
  vectorStore: VercelPostgres
): Promise<Map<string, string>> {
  let results: QueryResult<{
    id: string;
    notion_id: string;
    last_edited_time: string;
  }> = await vectorStore.client.query(`
    SELECT * 
    FROM (
      SELECT id, 
        "${vectorStore.metadataColumnName}" #>> '{notionId}' as notion_id,
        "${vectorStore.metadataColumnName}" #>> '{last_edited_time}' as last_edited_time
      FROM "${vectorStore.tableName}"
    ) as pages 
    WHERE notion_id IS NOT NULL
  `);

  return results.rows.reduce(
    (map, row) => map.set(row.notion_id, row.last_edited_time),
    new Map()
  );
}

async function deleteNotionDocuments(
  vectorStore: VercelPostgres,
  notionId: string
) {
  await vectorStore.client.query(
    `
    DELETE FROM "${vectorStore.tableName}"
    WHERE "${vectorStore.metadataColumnName}" #>> '{notionId}' = $1
  `,
    [notionId]
  );
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

async function loadPage(
  pageId: string,
  lastEdited: string | undefined
): Promise<Document[]> {
  const pageLoader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    propertiesAsHeader: true,
    checkLastEditedAfter: lastEdited,
    id: pageId,
  });

  let docs = await pageLoader.loadAndSplit(textSplitter);

  let isChunked = docs.length > 1;

  for (let i in docs) {
    let doc = docs[i];
    addHeader(doc, {
      Type: "Notion Page",
      Title: pageLoader.rootTitle,
      ...(isChunked ? { Chunk: i } : {}),
    });
  }

  return docs;
}

async function loadDatabase(databaseId: string): Promise<Document[]> {
  const dbLoader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    id: databaseId,
    propertiesAsHeader: true,
    loadRowsAsPages: false,
  });

  let docs = await dbLoader.load();

  for (let i in docs) {
    let doc = docs[i];
    addHeader(doc, {
      Type: "Notion Database Entry",
      Database: dbLoader.rootTitle,
    });
  }

  return docs;
}

function addHeader(doc: Document, header: Record<string, string>) {
  let hasFrontmatter = doc.pageContent.startsWith("---\n");
  if (hasFrontmatter) doc.pageContent = doc.pageContent.substring(4);

  doc.pageContent =
    "---\n" +
    `${yaml.dump(header)}` +
    (hasFrontmatter ? "" : "---\n\n") +
    doc.pageContent;
}
