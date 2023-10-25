import { app } from '../src/slack/app';
import { RequestContext } from '@vercel/edge';

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
  return await app.run(request, context);
}
