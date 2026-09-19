export function setAuthSession(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('auth-state-change'));
}

export function getAuthUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return Boolean(token && user);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-state-change'));
}
