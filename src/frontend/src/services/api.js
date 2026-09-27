const API_URL = "http://127.0.0.1:8000";

async function readResponse(response, fallback) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || fallback);
  return payload;
}

export function getStoredToken() {
  return localStorage.getItem("alzdx_token");
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function analyzeAssessment(audioFile, transcript) {
  const formData = new FormData();
  formData.append("file", audioFile, audioFile.name || "recording.webm");
  formData.append("transcript", transcript ?? "");

  const response = await fetch(`${API_URL}/api/assessment/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  return readResponse(response, "Assessment analysis failed.");
}

export async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append("file", audioFile, audioFile.name || "recording.webm");
  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  return readResponse(response, "Audio transcription failed.");
}

export async function fetchAssessments() {
  const response = await fetch(`${API_URL}/api/assessments`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, "Could not load assessment history.");
}

export async function fetchAssessment(assessmentId) {
  const response = await fetch(`${API_URL}/api/assessments/${assessmentId}`, {
    headers: getAuthHeaders(),
  });
  return readResponse(response, "Could not load assessment details.");
}

export async function sendChatMessage(assessmentId, message, history = []) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      assessmentId,
      message,
      history,
    }),
  });
  return readResponse(
    response,
    "Unable to reach AlzDx AI Assistant. Please verify your GEMINI_API_KEY and network connection."
  );
}

/* ---------------- Authentication & Profile APIs ---------------- */

export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });
  return readResponse(response, "Login failed. Please check your credentials.");
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return readResponse(response, "Registration failed. Please try a different username.");
}

export async function fetchCurrentUser(token) {
  const authToken = token || getStoredToken();
  if (!authToken) throw new Error("No authentication token found.");

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return readResponse(response, "Failed to load user profile.");
}

export async function updateUserProfile(data, token) {
  const authToken = token || getStoredToken();
  if (!authToken) throw new Error("Authentication required.");

  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });
  return readResponse(response, "Failed to update profile.");
}

export async function fetchUserProfileStats(token) {
  const authToken = token || getStoredToken();
  if (!authToken) throw new Error("Authentication required.");

  const response = await fetch(`${API_URL}/api/auth/profile/stats`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return readResponse(response, "Failed to load profile statistics.");
}
