import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://localhost:3000/api';

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
}

export async function setUser(user: any) {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

export async function getUser() {
  try {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function clearAuth() {
  await removeToken();
  await SecureStore.deleteItemAsync(USER_KEY);
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  post: (endpoint: string, body: any) => 
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  get: (endpoint: string) => 
    request(endpoint, {
      method: 'GET',
    }),
  put: (endpoint: string, body: any) => 
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (endpoint: string) => 
    request(endpoint, {
      method: 'DELETE',
    }),
};
