import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import { notionToken } from "../../constants";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/dist/document";
import { getVectorStore } from "./chain";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

export async function bootstrapAssistant() {
  const vectorStore = await getVectorStore();
  await vectorStore.delete({ deleteAll: true });

  await vectorStore.addDocuments(await loadWishlistDocuments());
  await vectorStore.addDocuments(await loadFellowshipPage());
}

async function loadFellowshipPage(): Promise<Document[]> {
  const pageLoader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    id: "09b68cd347434a789819b0ce853e24d3",
    type: "page",
  });

  return pageLoader.loadAndSplit(textSplitter);
}

async function loadWishlistDocuments(): Promise<Document[]> {
  const loader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    type: "database",
    id: "a18536c8d58f4cfe97419700fd5c2d82",
    propertiesAsHeader: true,
    callerOptions: {
      maxConcurrency: 64,
    },
  });

  var docs = await loader.load();
  for (var doc of docs) {
    let hasFrontmatter = doc.pageContent.startsWith("---\n");

    if (hasFrontmatter) doc.pageContent = doc.pageContent.substring(4);
    doc.pageContent =
      "---\nType: Database Entry\nDatabase: Wishlist\n" +
      (hasFrontmatter ? "" : "---\n\n") +
      doc.pageContent;
  }

  return [
    new Document({
      pageContent:
        "The wishlist is a notion database that contains suggestions from the community on how" +
        " to improve the My MM app. Users can vote on suggestions or add your own suggestion.",
    }),
    ...docs,
  ];
}
