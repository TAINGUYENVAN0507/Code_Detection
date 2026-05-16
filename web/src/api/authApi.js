import axios from "axios";
import { API_BASE_URL } from "./config";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!token || !rawUser) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(rawUser),
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveAuth(authData) {
  localStorage.setItem(TOKEN_KEY, authData.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function registerUser({ username, email, password, rePassword }) {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, {
    username,
    email,
    password,
    re_password: rePassword,
  });

  saveAuth(response.data);
  return response.data;
}

export async function loginUser({ username, password }) {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    username,
    password,
  });

  saveAuth(response.data);
  return response.data;
}
