import { slack } from "../src/slack";
import { RequestContext } from "@vercel/edge";

// Import all features that register events, shortcuts or actions
import "../src/features/assistant/index";
import "../src/features/community_credits/index";
import "../src/features/home/index";
import "../src/features/post_creator/index";
import "../src/features/wishlist/index";
import "../src/features/inbox/index";

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
export default async function events(
  request: Request,
  context: RequestContext
) {
  return await slack.run(request, context);
}
