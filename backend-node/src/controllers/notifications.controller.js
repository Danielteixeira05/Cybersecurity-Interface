import { listNotifications, markNotificationRead } from '../services/notifications.service.js';

export async function list(request, response, next) {
  try { return response.json({ items: await listNotifications(request.auth, request.query) }); } catch (error) { return next(error); }
}

export async function markRead(request, response, next) {
  try { return response.json(await markNotificationRead(request.auth, request.params.notificationId)); } catch (error) { return next(error); }
}
