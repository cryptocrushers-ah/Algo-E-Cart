"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"; // your FastAPI backend URL

// ------------------
// Auth Client
// ------------------
export const authClient = {
  // ✅ Sign in with email/password
  signIn: {
    email: async ({
      email,
      password,
      rememberMe,
      callbackURL,
    }: {
      email: string;
      password: string;
      rememberMe?: boolean;
      callbackURL?: string;
    }) => {
      try {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
        });

        const token = res.data?.access_token;

        if (token) {
          // Store token in localStorage (or cookie)
          localStorage.setItem("bearer_token", token);
          if (rememberMe) {
            localStorage.setItem("remember_me", "true");
          }

          return { data: res.data };
        }

        return { error: { code: "NO_TOKEN", message: "No token returned" } };
      } catch (err: any) {
        console.error("Login error:", err);
        return {
          error: {
            code: "LOGIN_FAILED",
            message: err.response?.data?.detail || "Login failed",
          },
        };
      }
    },
  },

  // ✅ Fetch session info from backend
  getSession: async (options?: any) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("bearer_token")
        : null;

    if (!token) {
      return { data: null };
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ...options,
      });

      return { data: res.data };
    } catch (err) {
      console.error("Session fetch error:", err);
      return { data: null };
    }
  },

  // ✅ Logout
  signOut: async () => {
    try {
      localStorage.removeItem("bearer_token");
      localStorage.removeItem("remember_me");
    } catch (err) {
      console.error("Logout error:", err);
    }
  },
};

// ------------------
// useSession Hook
// ------------------
type SessionData = {
  user?: any;
  token?: string;
  [key: string]: any;
};

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchSession = async () => {
    try {
      setIsPending(true);
      const res = await authClient.getSession();
      setSession(res.data);
      setError(null);
    } catch (err) {
      console.error("useSession error:", err);
      setError(err);
      setSession(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { data: session, isPending, error, refetch: fetchSession };
}
