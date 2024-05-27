import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

import { notionEnv, openaiToken } from "../../../constants";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiToken,
});

export const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  openAIApiKey: openaiToken,
});

export async function getVectorStore() {
  return VercelPostgres.initialize(embeddings, {
    tableName: notionEnv == "production" ? "vectors_production" : "vectors_dev",
  });
}
