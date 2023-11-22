import { MentionRichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import { DatabaseRow, Property, notion } from "../../../notion";
import { getVectorStore } from "../ai/chain";
import { notionEnv, notionToken } from "../../../constants";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/dist/document";
import { QueryResult } from "@vercel/postgres";
import { VercelPostgres } from "langchain/vectorstores/vercel_postgres";
import { LoaderStats, NotionAPILoader } from "./notion_loader";
import yaml from "js-yaml";

export const assistantIndexDatabaseId =
  notionEnv == "production"
    ? "9960f3b53a9545a99ee1951851086911"
    : "f6004560d0b54e3384a42a2f4d59687b";

/**
 * Type definition for a row in the Assistant Index database.
 */
export type AssistantIndexRow = DatabaseRow<{
  Name: Property<"title">;
  Type: Property<"select">;
}>;

var _m: MentionRichTextItemResponse;
type IndexTarget = Extract<typeof _m.mention, { type: "page" | "database" }>;

export type ReportInfo =
  | {
      type: "update";
      target: "page" | "database";
      id: string;
      stats: Record<keyof LoaderStats, number>;
    }
  | {
      type: "removed";
      id: string;
      amount: number;
    };

export async function loadNotionPages(
  report?: (info: ReportInfo) => Promise<void>
) {
  try {
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

      let targetType = target.type;
      let targetId =
        target.type == "page" ? target.page.id : target.database.id;
      let existingLastEdited = existingTimestamps.get(targetId);
      existingTimestamps.delete(targetId);

      let options: LoadingOptions =
        targetType == "page"
          ? {
              lastEdited: existingLastEdited,
              splitDocuments: true,
              titleKey: "Title",
              addChunkHeader: true,
              getHeader: (_) => ({ Type: "Notion Page" }),
            }
          : {
              lastEdited: existingLastEdited,
              splitDocuments: false,
              titleKey: "Database",
              addChunkHeader: false,
              getHeader: (doc) =>
                doc.metadata.notionId != doc.metadata.targetId
                  ? { Type: "Notion Database Entry" }
                  : { Type: "Notion Database" },
            };

      let { docs, stats } = await loadPage(targetId, options);

      for (let notionId of stats.removed) {
        await deleteNotionDocuments(vectorStore, notionId, "notionId");
      }

      if (docs.length > 0) {
        await vectorStore.addDocuments(docs);
      }

      console.log(
        `Completed loading documents for ${targetType} ${targetId}:\n` +
          `- Skipped ${stats.skipped.length}\n- Updated ${stats.updated.length}\n- Added ${stats.added.length}\n- Removed ${stats.removed.length}`
      );

      await report?.({
        type: "update",
        target: targetType,
        id: targetId,
        stats: Object.fromEntries(
          Object.entries(stats).map(([k, v]) => [k, v.length])
        ) as Record<keyof LoaderStats, number>,
      });
    }

    for (let targetId of existingTimestamps.keys()) {
      let deleted = await deleteNotionDocuments(
        vectorStore,
        targetId,
        "targetId"
      );

      console.log(`Removed ${deleted} documents for ${targetId}`);

      await report?.({
        type: "removed",
        id: targetId,
        amount: deleted,
      });
    }
  } catch (e: any) {
    console.log("Error at syncing notion index", e, e.message, e.errors);
    throw e;
  }
}

async function queryNotionDocuments(
  vectorStore: VercelPostgres
): Promise<Map<string, Map<string, string>>> {
  let results: QueryResult<{
    target_id: string;
    docs: { notion_id: string; last_edited_time: string }[];
  }> = await vectorStore.client.query(`
    SELECT target_id, array_agg(row_to_json(pages.*)) as docs
    FROM (
      SELECT
        "${vectorStore.metadataColumnName}" #>> '{targetId}' as target_id,
        "${vectorStore.metadataColumnName}" #>> '{notionId}' as notion_id,
        "${vectorStore.metadataColumnName}" #>> '{last_edited_time}' as last_edited_time
      FROM "${vectorStore.tableName}"
    ) as pages 
    WHERE notion_id IS NOT NULL
    GROUP BY target_id
  `);

  return toMap(
    results.rows,
    (r) => r.target_id,
    (r) =>
      toMap(
        r.docs,
        (d) => d.notion_id,
        (d) => d.last_edited_time
      )
  );
}

function toMap<T, K, V>(
  entries: T[],
  key: (e: T) => K,
  val: (e: T) => V
): Map<K, V> {
  return entries.reduce((map, e) => map.set(key(e), val(e)), new Map<K, V>());
}

async function deleteNotionDocuments(
  vectorStore: VercelPostgres,
  targetId: string,
  idName: "notionId" | "targetId"
): Promise<number> {
  const result = await vectorStore.client.query(
    `
    DELETE FROM "${vectorStore.tableName}"
    WHERE "${vectorStore.metadataColumnName}" #>> '{${idName}}' = $1
  `,
    [targetId]
  );

  return result.rowCount;
}

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

interface LoadingOptions {
  lastEdited: Map<string, string> | undefined;
  splitDocuments: boolean;
  titleKey: string;
  getHeader?: (doc: Document) => Record<string, string>;
  addChunkHeader?: boolean;
}

async function loadPage(
  pageId: string,
  options: LoadingOptions
): Promise<{ docs: Document[]; stats: LoaderStats }> {
  const loader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    id: pageId,
    propertiesAsHeader: true,
    loadRowsAsPages: false,
    checkEditTimestamps: options.lastEdited,
  });

  let docs = await (options.splitDocuments
    ? loader.loadAndSplit(textSplitter)
    : loader.load());

  let isChunked = docs.length > 1;

  for (let i in docs) {
    let doc = docs[i];

    addHeader(doc, {
      ...(options.getHeader?.(doc) ?? {}),
      [options.titleKey]: loader.rootTitle,
      ...((options.addChunkHeader ?? false) && isChunked ? { Chunk: i } : {}),
    });
  }

  return { docs, stats: loader.stats };
}

function addHeader(doc: Document, header: Record<string, string>) {
  if (doc.pageContent == null) {
    doc.pageContent = "";
  }
  let hasFrontmatter = doc.pageContent.startsWith("---\n");
  if (hasFrontmatter) doc.pageContent = doc.pageContent.substring(4);

  doc.pageContent =
    "---\n" +
    `${yaml.dump(header)}` +
    (hasFrontmatter ? "" : "---\n\n") +
    doc.pageContent;
}
