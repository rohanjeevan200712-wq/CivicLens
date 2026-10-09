const BASE_URL = '/api';

export async function checkServerHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function analyzeComplaintIntake({ photoFile, audioFile, text, languageHint, imageBase64 }) {
  const formData = new FormData();
  if (photoFile) formData.append('photo', photoFile);
  if (audioFile) formData.append('audio', audioFile);
  if (text) formData.append('text', text);
  if (languageHint) formData.append('languageHint', languageHint);
  if (imageBase64) formData.append('imageBase64', imageBase64);

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis failed with status ${res.status}`);
  }

  return res.json();
}

export async function submitComplaint(payload) {
  const res = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Submission failed');
  }

  return res.json();
}

export async function fetchAllComplaints(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/complaints${query ? `?${query}` : ''}`);
  return res.json();
}

export async function fetchComplaintById(id) {
  const res = await fetch(`${BASE_URL}/complaints/${id}`);
  if (!res.ok) throw new Error('Complaint not found');
  return res.json();
}

export async function updateStatus(id, status, note = '') {
  const res = await fetch(`${BASE_URL}/complaints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });
  return res.json();
}

export async function upvoteComplaint(id) {
  const res = await fetch(`${BASE_URL}/complaints/${id}/upvote`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchAdminClusters() {
  const res = await fetch(`${BASE_URL}/admin/clusters`);
  return res.json();
}

export async function fetchAdminMetrics() {
  const res = await fetch(`${BASE_URL}/admin/metrics`);
  return res.json();
}

export async function fetchHelplines() {
  const res = await fetch(`${BASE_URL}/helplines`);
  return res.json();
}

export async function resetSeedData() {
  const res = await fetch(`${BASE_URL}/seed/reset`, {
    method: 'POST'
  });
  return res.json();
}
