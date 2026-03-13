import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Activities
export const getActivities = () => api.get("/activities/").then((r) => r.data);
export const createActivity = (data) => api.post("/activities/", data).then((r) => r.data);
export const updateActivity = (id, data) => api.put(`/activities/${id}`, data).then((r) => r.data);
export const deleteActivity = (id) => api.delete(`/activities/${id}`);

// Activity custom fields
export const getFields = (activityId) => api.get(`/activities/${activityId}/fields/`).then((r) => r.data);
export const createField = (activityId, data) => api.post(`/activities/${activityId}/fields/`, data).then((r) => r.data);
export const updateField = (activityId, fieldId, data) => api.put(`/activities/${activityId}/fields/${fieldId}`, data).then((r) => r.data);
export const deleteField = (activityId, fieldId) => api.delete(`/activities/${activityId}/fields/${fieldId}`);

// Rewards
export const getRewards = () => api.get("/rewards/").then((r) => r.data);
export const createReward = (data) => api.post("/rewards/", data).then((r) => r.data);
export const updateReward = (id, data) => api.put(`/rewards/${id}`, data).then((r) => r.data);
export const deleteReward = (id) => api.delete(`/rewards/${id}`);
export const redeemReward = (id, data = {}) => api.post(`/redemptions/${id}/redeem`, data).then((r) => r.data);

// Activity logs
export const getLogs = (params = {}) => api.get("/logs/", { params }).then((r) => r.data);
export const createLog = (data) => api.post("/logs/", data).then((r) => r.data);
export const updateLog = (id, data) => api.put(`/logs/${id}`, data).then((r) => r.data);
export const deleteLog = (id) => api.delete(`/logs/${id}`);

// Progress
export const getProgressSummary = () => api.get("/progress/summary").then((r) => r.data);
export const getProgressLogs = (params = {}) => api.get("/progress/logs", { params }).then((r) => r.data);
export const getProgressRedemptions = (params = {}) => api.get("/progress/redemptions", { params }).then((r) => r.data);
