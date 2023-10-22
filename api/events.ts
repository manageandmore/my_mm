import { app } from '../src/slack/app';
import { RequestContext } from '@vercel/edge';

export const config = {
  runtime: 'edge',
};

export default async function events(request: Request, context: RequestContext) {
  return await app.run(request, context);
}
