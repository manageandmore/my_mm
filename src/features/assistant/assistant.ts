import { VercelPostgres } from "langchain/vectorstores/vercel_postgres";
import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import { notionToken, openaiToken } from "../../constants";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChainValues } from "langchain/dist/schema";
import { Document } from "langchain/dist/document";

// Loading a page (including child pages all as separate documents)
const pageLoader = new NotionAPILoader({
  clientOptions: {
    auth: notionToken,
  },
  id: "09b68cd347434a789819b0ce853e24d3",
  type: "page",
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiToken
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", openAIApiKey: openaiToken });

const template = `You are a smart and casual ai assistant.
Use the following pieces of context to respond to the prompt at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.
{context}
Prompt: {question}
Helpful Response:`;

export async function bootstrap(fn: (data: any) => void) {
  console.log("STARTING BOOTSTRAP")
  const vectorStore = await VercelPostgres.initialize(embeddings)
  await vectorStore.delete({deleteAll: true})

  fn("started")

  const scholarsLoader = new NotionAPILoader({
    clientOptions: {
      auth: notionToken,
    },
    type: 'database',
    id: 'a18536c8d58f4cfe97419700fd5c2d82',
    propertiesAsHeader: true,
    onDocumentLoaded: (current, total, currentTitle) => {
      const log = `Loaded Page: ${currentTitle} (${current}/${total})`;
      console.log(log)
      fn(log);
    },
    callerOptions: {
      maxConcurrency: 64,
    },
  })

  var docs = await scholarsLoader.load()
  for (var doc of docs) {
    let hasFrontmatter = doc.pageContent.startsWith('---\n')

    if (hasFrontmatter) doc.pageContent = doc.pageContent.substring(4)
    doc.pageContent = '---\nType: Database Entry\nDatabase: Wishlist\n' + (hasFrontmatter ? '' : '---\n\n') + doc.pageContent
  }
  fn(JSON.stringify(docs))
  await vectorStore.addDocuments([new Document({
    pageContent: 'The wishlist is a notion database that contains suggestions from the community on how'+
    ' to improve the My MM app. Users can vote on suggestions or add your own suggestion.'
  })])
  await vectorStore.addDocuments(docs)
  console.log("scholars done")
  fn("scholars done")
  await vectorStore.addDocuments(await pageLoader.loadAndSplit(textSplitter))
  fn("page done")
}

export async function run(prompt: string): Promise<ChainValues> {
  const vectorStore = await VercelPostgres.initialize(embeddings, {
    
  })

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    returnSourceDocuments: true,
    prompt: PromptTemplate.fromTemplate(template),
  });

  const results = await chain.call({query: prompt});

  console.log(results);

  return results
}