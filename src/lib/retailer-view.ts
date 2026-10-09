"use client";

import { useEffect, useState } from "react";

export interface RetailerViewAccount {
  account_id: string;
  account_name?: string;
}

const COOKIE_ACCOUNT_ID = "retailer_view_account_id";
const COOKIE_ACCOUNT_NAME = "retailer_view_account_name";
const STORAGE_KEY = "retailer_view_account";
const EVENT_NAME = "retailer_view_state_change";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

function setCookieValue(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Stores the selected distributor account in retailer-view state.
 */
export function setRetailerViewAccount(account: RetailerViewAccount): void {
  if (typeof window === "undefined") return;

  setCookieValue(COOKIE_ACCOUNT_ID, account.account_id);
  if (account.account_name) {
    setCookieValue(COOKIE_ACCOUNT_NAME, account.account_name);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch (err) {
    console.error("Failed to write retailer_view_account to localStorage", err);
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: account }));
}

/**
 * Retrieves the currently active retailer-view account ID.
 */
export function getRetailerViewAccountId(): string | null {
  if (typeof document !== "undefined") {
    const fromCookie = getCookieValue(COOKIE_ACCOUNT_ID);
    if (fromCookie) return fromCookie;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.account_id) return parsed.account_id;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Retrieves full retailer-view account details.
 */
export function getRetailerViewAccount(): RetailerViewAccount | null {
  if (typeof document === "undefined") return null;

  const accountId = getRetailerViewAccountId();
  if (!accountId) return null;

  const accountName = getCookieValue(COOKIE_ACCOUNT_NAME);
  if (accountName) {
    return { account_id: accountId, account_name: accountName };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.account_id) return parsed;
    }
  } catch {
    // ignore
  }

  return { account_id: accountId };
}

/**
 * Checks whether an admin is currently in retailer-view mode.
 */
export function isRetailerViewActive(): boolean {
  return !!getRetailerViewAccountId();
}

/**
 * Clears retailer-view state (returns back to standard admin view).
 */
export function clearRetailerView(): void {
  if (typeof window === "undefined") return;

  deleteCookie(COOKIE_ACCOUNT_ID);
  deleteCookie(COOKIE_ACCOUNT_NAME);

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

/**
 * React hook for reacting to retailer-view state changes.
 */
export function useRetailerView() {
  const [account, setAccount] = useState<RetailerViewAccount | null>(() => {
    return typeof window !== "undefined" ? getRetailerViewAccount() : null;
  });

  useEffect(() => {
    const update = () => {
      setAccount(getRetailerViewAccount());
    };

    update();
    window.addEventListener(EVENT_NAME, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return {
    isRetailerView: !!account?.account_id,
    accountId: account?.account_id ?? null,
    accountName: account?.account_name ?? null,
    exitRetailerView: clearRetailerView,
  };
}
