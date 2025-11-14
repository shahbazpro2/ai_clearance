// Get access token from cookies
export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const accessTokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("access_token=")
  );

  return accessTokenCookie ? accessTokenCookie.split("=")[1] : null;
}

// Get refresh token from cookies
export function getRefreshToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("refresh_token=")
  );

  return refreshTokenCookie ? refreshTokenCookie.split("=")[1] : null;
}

// Set access token in cookies
export function setAccessToken(token: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `access_token=${token}; path=/;`;
}

// Set refresh token in cookies
export function setRefreshToken(token: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `refresh_token=${token}; path=/;`; // 30 days
}

export function setIsActive(isActive: boolean): void {
  if (typeof document === "undefined") return;

  document.cookie = `is_active=${isActive}; path=/;`; // 30 days
}

// Get is_active status from cookies
export function getIsActive(): boolean {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";");
  const isActiveCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("is_active=")
  );

  return isActiveCookie ? isActiveCookie.split("=")[1] === "true" : false;
}

// Remove all authentication tokens
export function clearAuthTokens(): void {
  if (typeof document === "undefined") return;

  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
  document.cookie =
    "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Logout user
export function logout(): void {
  clearAuthTokens();
  setTimeout(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, 1000);
}
