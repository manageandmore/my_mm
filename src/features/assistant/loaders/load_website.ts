import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getVectorStore } from "../ai/chain";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { QueryResult } from "@vercel/postgres";
import { toHash, toMap } from "../../common/utils";
import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";
import { Task } from "../../common/task_utils";

/**
 * Background task that syncs all pages from the ManageAndMore website.
 */
export const syncWebsiteTask: Task<PageInfo> = {
  name: "website sync",
  run: loadWebsite,
  display(data) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Page ${data.page}: ${data.status}`,
        },
      },
    ];
  },
};

type PageInfo = {
  page: string;
  status: "added" | "updated" | "removed" | "skipped";
};

/**
 * Syncs all pages from the ManageAndMore website.
 */
async function loadWebsite(
  _: any,
  report?: (data: PageInfo) => Promise<void>
) {
  try {
    const vectorStore = await getVectorStore();

    const existingPages = await queryWebsiteDocuments(vectorStore);

    // We sync these pages.
    const pages = [
      "/",
      "/curriculum",
      "/events",
      "/application",
      "/people",
      "/start-ups",
      "/impact",
    ];

    for (var page of pages) {
      // Load the website and extract the <header> and <main> sections as text.
      const loader = new CheerioWebBaseLoader(
        "https://www.manageandmore.de" + page,
        { selector: "header, main" }
      );

      // Preload and hash the content to check if it needs updating.
      const hash = await toHash((await loader.scrape()).text());
      const existingHash = existingPages.get(page);
      existingPages.delete(page);

      // If the hash hasn't changed, we skip updating the page.
      if (hash == existingHash) {
        await report?.({ page, status: "skipped" });
        continue;
      }

      // Load the website and split into documents.
      let docs = await loader.load();
      docs = await new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 0,
      }).splitDocuments(docs);

      // Delete any existing documents for this page.
      await deleteWebsiteDocumentsForPage(vectorStore, page);

      for (var doc of docs) {
        doc.pageContent =
          "---\nType: Website Page\nUrl: https://www.manageandmore.de" +
          page +
          "\n---\n" +
          doc.pageContent;

        doc.metadata = {
          type: "website.page",
          page: page,
          url: "https://www.manageandmore.de" + page,
          content_hash: hash,
        };
      }

      // Add the documents to the vector database.
      await vectorStore.addDocuments(docs);

      await report?.({ page, status: existingHash ? "updated" : "added" });
    }

    // Delete any pages no longer synced (in case we modified the list of pages above).
    for (let page of existingPages.keys()) {
      const deleted = await deleteWebsiteDocumentsForPage(vectorStore, page);

      console.log(`Removed ${deleted} documents for page ${page}`);
      await report?.({ page, status: "removed" });
    }
  } catch (e: any) {
    console.log("Error at syncing website", e, e.message, e.errors);
    throw e;
  }
}

async function queryWebsiteDocuments(
  vectorStore: VercelPostgres
): Promise<Map<string, string>> {
  let results: QueryResult<{
    page: string;
    content_hash: string;
  }> = await vectorStore.client.query(`
    SELECT page, content_hash
    FROM (
      SELECT
        "${vectorStore.metadataColumnName}" #>> '{type}' as type,
        "${vectorStore.metadataColumnName}" #>> '{page}' as page,
        "${vectorStore.metadataColumnName}" #>> '{content_hash}' as content_hash
      FROM "${vectorStore.tableName}"
    ) as pages 
    WHERE type = 'website.page'
    GROUP BY page, content_hash
  `);

  return toMap(
    results.rows,
    (r) => r.page,
    (r) => r.content_hash
  );
}

async function deleteWebsiteDocumentsForPage(
  vectorStore: VercelPostgres,
  page: string
): Promise<number> {
  const result = await vectorStore.client.query(
    `
    DELETE FROM "${vectorStore.tableName}"
    WHERE "${vectorStore.metadataColumnName}" #>> '{type}' = 'website.page' 
    AND "${vectorStore.metadataColumnName}" #>> '{page}' = $1
  `,
    [page]
  );

  return result.rowCount;
}
