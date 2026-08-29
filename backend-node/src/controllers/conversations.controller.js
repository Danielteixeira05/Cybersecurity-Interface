import { ensureConversation, listConversations, listMessages, markConversationRead, sendMessage } from '../services/conversations.service.js';

export async function list(request, response, next) {
  try { return response.json({ items: await listConversations(request.auth) }); } catch (error) { return next(error); }
}

export async function ensure(request, response, next) {
  try { return response.status(201).json(await ensureConversation(request.auth, request.body ?? {})); } catch (error) { return next(error); }
}

export async function messages(request, response, next) {
  try { return response.json(await listMessages(request.auth, request.params.conversationId, request.query)); } catch (error) { return next(error); }
}

export async function send(request, response, next) {
  try { return response.status(201).json(await sendMessage(request.auth, request.params.conversationId, request.body ?? {})); } catch (error) { return next(error); }
}

export async function markRead(request, response, next) {
  try { return response.json(await markConversationRead(request.auth, request.params.conversationId)); } catch (error) { return next(error); }
}
