import { RetrievalQAChain } from "langchain/chains";
import { ChainValues } from "langchain/dist/schema";
import { PromptTemplate } from "langchain/prompts";
import { getVectorStore, model } from "./chain";

const template = `You are a smart and casual ai assistant.
Use the following pieces of context to respond to the prompt at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.
{context}
Prompt: {question}
Helpful Response:`;

export async function promptAssistant(prompt: string): Promise<ChainValues> {
  const vectorStore = await getVectorStore()

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    returnSourceDocuments: true,
    prompt: PromptTemplate.fromTemplate(template),
  });

  const results = await chain.call({query: prompt});
  return results
}