import { listActivityLogs } from '../services/logs.service.js';

export function createListActivityLogsController(logReader = listActivityLogs) {
  return async function list(request, response, next) {
    try {
      return response.json(await logReader(request.query));
    } catch (error) {
      return next(error);
    }
  };
}

export const list = createListActivityLogsController();
