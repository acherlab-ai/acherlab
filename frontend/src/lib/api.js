const API = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  me: () => request('/auth/me'),
};

export const sandboxes = {
  stats: () => request('/sandboxes/stats'),
  running: () => request('/sandboxes/running'),
  history: (page) => request(`/sandboxes/history?page=${page}`),
  create: (config) => request('/sandboxes/create', { method: 'POST', body: JSON.stringify({ config }) }),
  stop: (id) => request(`/sandboxes/${id}/stop`, { method: 'POST' }),
  start: (id) => request(`/sandboxes/${id}/start`, { method: 'POST' }),
  get: (id) => request(`/sandboxes/${id}`),
  specs: () => request('/sandboxes/specs'),
  plans: () => request('/sandboxes/plans'),
};

export const admin = {
  users: () => request('/admin/users'),
  sandboxes: () => request('/admin/sandboxes'),
  updatePlan: (id, plan) => request(`/admin/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) }),
  apiKeys: () => request('/admin/api-keys'),
  addApiKey: (data) => request('/admin/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  updateApiKey: (id, data) => request(`/admin/api-keys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApiKey: (id) => request(`/admin/api-keys/${id}`, { method: 'DELETE' }),
  stats: () => request('/admin/stats'),
  planLimits: () => request('/admin/plan-limits'),
  updatePlanLimit: (plan, key, value) => request('/admin/plan-limits', { method: 'POST', body: JSON.stringify({ plan, key, value }) }),
};
