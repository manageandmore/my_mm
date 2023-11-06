import { slack } from '../src/slack';
import { RequestContext } from '@vercel/edge';

// Import all features that register events, shortcuts or actions
import '../src/features/assistant/event';
import '../src/features/assistant/shortcut';
import '../src/features/home/event';
import '../src/features/post_generator/shortcut';
import '../src/features/post_generator/message';
import '../src/features/wishlist/index';

/**
 * Configures the vercel deployment to use the edge runtime. 
 */
export const config = {
  runtime: 'edge',
};

/** 
 * Handler for the /api/events route.
 * 
 * This route is called by slack when any event happens.
 *  */
export default async function events(request: Request, context: RequestContext) {
  return await slack.run(request, context);
}
