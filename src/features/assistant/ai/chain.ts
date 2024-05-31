import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { Document, DocumentInterface } from "@langchain/core/documents";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { notionEnv, openaiToken } from "../../../constants";

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiToken,
});

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  openAIApiKey: openaiToken,
});

export async function getVectorStore() {
  return VercelPostgres.initialize(embeddings, {
    tableName: notionEnv == "production" ? "vectors_production" : "vectors_dev",
  });
}

const template = `You are the ManageAndMore assistant, a smart and casual ai assistant that helps people from ManageAndMore with questions
they have about anything related to the program, its members, its content, or similar. 

Try to keep the response relatively short and concise by default, but don't miss out on important details. Give a more elaborate answer if the users asks for it.

Use the following pieces of context to respond to the question at the end. Use only the pieces that are relevant and leverage them to give an informed response. Each piece of context has an ID and Content part.
If you don't know the answer to the users question, just say that you don't know, don't try to make up an answer.

== Start of context ==
{context}
== End of context ==

Respond only in valid JSON using the format {{"response": "Your helpful response.", "relevant_context_ids": ["abc", "def"]}}.
The "response" property contains your response to the users question, and the "relevant_context_ids" property contains the ids of all the context pieces that are relevant to your response. 
Include ids from all pieces that are relevant for your response (probably multiple pieces), but don't include ids from unrelated pieces. If none of the context is relevant make this an empty array.

The current date and time is: {time}
The users question is:
{input}
`;

async function getChain() {
  // construct a new chain for our assistant
  return RunnablePassthrough.assign<
    { input: string, time: string },
    { context: DocumentInterface<Record<string, any>>[] }
  >({
    context: RunnableSequence.from([
      // get input prompt from chain data
      (data) => data.input as string,
      // retrieve the best 10 documents from the vector store
      (await getVectorStore()).asRetriever({ k: 10 }),
    ]).pipe((docs) =>
      // add context_id for each document
      docs.map((doc, index) => {
        var content = doc.pageContent;
        if (content.startsWith("---\n")) {
          content = "---\nID: " + index + content.substring(3);
        } else {
          content = "---\nID: " + index + "\n---\n" + content;
        }
        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            context_id: index,
            context_content: content,
          },
        };
      })
    ),
  }).pipe(
    RunnablePassthrough.assign({
      answer: await createStuffDocumentsChain({
        // prompt part for each document
        documentPrompt: PromptTemplate.fromTemplate("{context_content}"),
        documentSeparator: "\n\n======\n\n",
        // combine everything in the main prompt
        prompt: PromptTemplate.fromTemplate(template),
        // pass the combined prompt to the llm
        llm: model,
        // parse the output into our json structure
        outputParser: new JsonOutputParser<{
          response: string;
          relevant_context_ids: string[];
        }>(),
      }),
    })
  );
}

export async function promptAssistant(prompt: string): Promise<{
  response: string,
  learnMore: string[],
}> {
  // get the assistant chain
  const chain = await getChain();

  // invoke the chain with the users prompt
  const result = await chain.invoke({ input: prompt, time: new Date().toISOString() });

  // find all relevant context documents and transform into links
  let learnMoreLinks: string[] = [];
  for (let contextId of result.answer.relevant_context_ids) {
    let doc = result.context.find(
      (doc) => doc.metadata.context_id == contextId
    );
    if (doc != undefined) {
      let link = getFormattedSourceLink(doc);
      if (link != null && !learnMoreLinks.includes(link)) {
        learnMoreLinks.push(link);
      }
    }
  }

  return {
    response: result.answer.response,
    learnMore: learnMoreLinks,
  }
}

function getFormattedSourceLink(doc: Document): string | null {
  const meta = doc.metadata;

  if (meta.notionId != null) {
    return `<${meta.url}|${meta.title}>`;
  } else if (meta.type == "slack.message") {
    return `<${meta.link}|${meta.title}>`;
  } else if (meta.type == "website.page") {
    return `<${meta.url}|manageandmore.de${meta.page}>`;
  } else {
    return null;
  }
}
