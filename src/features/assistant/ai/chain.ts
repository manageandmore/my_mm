import { VercelPostgres } from "langchain/vectorstores/vercel_postgres";
import { openaiToken } from "../../../constants";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiToken,
});

export const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  openAIApiKey: openaiToken,
});

export async function getVectorStore() {
  return VercelPostgres.initialize(embeddings);
}
