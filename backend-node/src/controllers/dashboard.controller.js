import { dashboardFor } from '../services/dashboard.service.js';

export async function dashboard(request, response, next) {
  try {
    return response.json(await dashboardFor(request.auth));
  } catch (error) {
    return next(error);
  }
}
