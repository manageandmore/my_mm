import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getVectorStore } from "../ai/chain";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { QueryResult } from "@vercel/postgres";
import { toHash, toMap } from "../../common/utils";
import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 0,
});

export async function loadWebsite(report?: (page: string, status: 'added' | 'updated' | 'removed' | 'skipped') => Promise<void>) {
  try {
    const vectorStore = await getVectorStore();

    const existingPages = await queryWebsiteDocuments(vectorStore);

    const pages = ["/", "/curriculum", "/events", "/application", "/people", "/start-ups", "/impact"];

    for (var page of pages) {
      const loader = new CheerioWebBaseLoader(
        "https://www.manageandmore.de" + page,
        { selector: "header, main" }
      );

      const hash = await toHash((await loader.scrape()).text());
      const existingHash = existingPages.get(page);
      existingPages.delete(page);

      if (hash == existingHash) {
        await report?.(page, 'skipped');
        continue;
      }

      const docs = await loader.loadAndSplit(textSplitter);

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

      await vectorStore.addDocuments(docs);

      await report?.(page, existingHash ? 'updated' : 'added');
    }

    for (let page of existingPages.keys()) {
      const deleted = await deleteWebsiteDocumentsForPage(vectorStore, page);

      console.log(`Removed ${deleted} documents for page ${page}`);
      await report?.(page, 'removed');
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
