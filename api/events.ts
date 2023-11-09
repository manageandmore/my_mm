import { slack } from "../src/slack";
import { RequestContext } from "@vercel/edge";

// Import all features that register events, shortcuts or actions
import "../src/features/community_credits/index";
import "../src/features/assistant/index";
import "../src/features/home/index";
import "../src/features/post_generator/index";
import "../src/features/wishlist/index";

import { features } from "../src/features";

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
  await features.initialize(context.waitUntil.bind(context));
  return await slack.run(request, context);
}
