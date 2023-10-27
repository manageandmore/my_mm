import OpenAI from 'openai';
import { openaiToken } from './constants';

/** 
 * The api client to access the openai api.
 */
export const openai = new OpenAI({
  apiKey: openaiToken,
});

/**
 * The system message that should be used for all chatgpt queries.
 */
export const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
  role: 'system',
  content: 'You are a successful startup founder and coach. '+
  'Your main role is to coach and mentor scholars from the ManageAndMore scholarship and lead them through the Design Thinking process. '+
  'Your only answer with very short, concise and to the point advice. ',
}