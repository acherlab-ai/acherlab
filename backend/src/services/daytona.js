import fetch from 'node-fetch';

const DAYTONA_API = 'https://app.daytona.io/api';

class DaytonaService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async createSandbox({ snapshot, cpu, memory, disk, target = 'us', autoStopInterval }) {
    const body = { snapshot, target };
    if (cpu != null) body.cpu = cpu;
    if (memory != null) body.memory = memory;
    if (disk != null) body.disk = disk;
    if (autoStopInterval) body.autoStopInterval = autoStopInterval;

    const res = await fetch(`${DAYTONA_API}/sandbox`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create sandbox');
    return data;
  }

  async deleteSandbox(sandboxId) {
    const res = await fetch(`${DAYTONA_API}/sandbox/${sandboxId}`, {
      method: 'DELETE',
      headers: this.headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete sandbox');
    return data;
  }

  async getSandbox(sandboxId) {
    const res = await fetch(`${DAYTONA_API}/sandbox/${sandboxId}`, {
      headers: this.headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get sandbox');
    return data;
  }

  async createSshAccess(sandboxId) {
    const res = await fetch(`${DAYTONA_API}/sandbox/${sandboxId}/ssh-access`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create SSH access');
    return data;
  }

  async listSandboxes(params = {}) {
    const query = new URLSearchParams();
    if (params.states) query.set('states', params.states);
    if (params.limit) query.set('limit', params.limit);
    const url = `${DAYTONA_API}/sandbox${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, { headers: this.headers });
    const data = await res.json();
    return { items: data.items || data, total: data.total || (Array.isArray(data) ? data.length : 1) };
  }

  async getConfig() {
    const res = await fetch(`${DAYTONA_API}/config`, { headers: this.headers });
    return res.json();
  }

  async getSnapshots() {
    const res = await fetch(`${DAYTONA_API}/snapshots?limit=50`, { headers: this.headers });
    return res.json();
  }
}

export default DaytonaService;
