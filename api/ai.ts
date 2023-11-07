import { RequestContext } from "@vercel/edge";
import { promptAssistant } from "../src/features/assistant/ai/prompt";
import { loadNotionPages } from "../src/features/assistant/data/load_pages";

/**
 * Configures the vercel deployment to use the edge runtime.
 */
export const config = {
  runtime: "edge",
};

/**
 * Handler for the /api/events route.
 *
 * This route is called by slack when any event happens.
 *  */
export default async function ai(request: Request, context: RequestContext) {
  try {
    const shouldBootstrap = request.headers.get("AI-Bootstrap");
    if (shouldBootstrap != null) {
      await loadNotionPages();
      //await bootstrapAssistant();
      return new Response("Bootstrapping...", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const prompt = request.headers.get("AI-Prompt");
    if (prompt == null) {
      return new Response("No AI-Prompt header", { status: 400 });
    }
    const results = promptAssistant(prompt);
    return new Response(JSON.stringify(results), { status: 200 });
  } catch (e) {
    console.log(e, (e as any).error, (e as any).errors);
    return new Response(JSON.stringify(e), { status: 500 });
  }
}
