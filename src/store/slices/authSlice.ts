import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { User } from "../../types";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  sessionId: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  sessionId: null,
  refreshToken: null,
  hydrated: false,
};

const COOKIE_CONFIG = {
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  SESSION_ID: "sessionId",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

const USER_ID_MAP: Record<string, string> = {
  "admin": "e3af12c2-de09-47d1-9d0e-b25a214274f7",
};

const decodeJWT = (token: string): { sub?: string; roles?: string[]; sessionId?: string } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

const clearAuthCookies = () => {
  if (typeof window === "undefined") return;

  console.log("Clearing auth cookies...");

  Object.values(COOKIE_NAMES).forEach((cookieName) => {
    Cookies.remove(cookieName, COOKIE_CONFIG);
  });

  Object.values(COOKIE_NAMES).forEach((cookieName) => {
    Cookies.remove(cookieName, { path: "/" });
    Cookies.remove(cookieName, { path: "" });
    Cookies.remove(cookieName);
  });

  Object.values(COOKIE_NAMES).forEach((cookieName) => {
    Cookies.set(cookieName, "", {
      ...COOKIE_CONFIG,
      expires: new Date(0),
    });
  });

  const remaining = Object.values(COOKIE_NAMES)
    .map((name) => ({ name, value: Cookies.get(name) }))
    .filter((c) => c.value);

  if (remaining.length > 0) {
    console.warn("Some cookies still exist:", remaining);
  } else {
    console.log("All auth cookies cleared successfully");
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(
      state,
      action: PayloadAction<{
        token?: string;
        accessToken?: string;
        sessionId?: string;
        refreshToken?: string;
        type?: string;
        userId?: string;
        id?: string;
        username?: string;
        name?: string;
        email?: string;
        role?: string;
        roles?: string[];
        [key: string]: any;
      }>
    ) {
      const { 
        token, 
        accessToken, 
        sessionId, 
        refreshToken,
        ...userData 
      } = action.payload;

      const actualToken = token || accessToken;

      let username = userData.username;
      let roles = userData.roles || [];
      
      if (actualToken) {
        const decoded = decodeJWT(actualToken);
        console.log("Decoded JWT:", decoded);
        
        if (decoded) {
          username = username || decoded.sub;
          roles = roles.length ? roles : (decoded.roles || []);
        }
      }

      let userId = userData.userId || userData.id;
      
      if (!userId && username) {
        userId = USER_ID_MAP[username];
        console.log(`📋 Using mapped userId for ${username}: ${userId}`);
      }

      if (!userId) {
        console.warn("⚠️ No userId found! Using username as fallback.");
        userId = username || "unknown";
      }

      const role = roles.includes("ADMIN") ? "admin" : "member";

      const user: User = {
        id: userId,
        userId: userId,
        username: username || "unknown",
        name: userData.name || username || "User",
        email: userData.email || "",
        role: role as "admin" | "member",
        system: userData.system,
        isActive: userData.isActive ?? true,
        club: userData.club,
        phone: userData.phone,
        roles: roles,
      };

      console.log("✅ Constructed user object:", user);

      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = actualToken || null;
      state.sessionId = sessionId || null;
      state.refreshToken = refreshToken || null;
      state.hydrated = true;

      if (typeof window !== "undefined") {
        clearAuthCookies();

        if (actualToken) {
          Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, actualToken, {
            ...COOKIE_CONFIG,
            expires: 7,
          });
        }
        if (sessionId) {
          Cookies.set(COOKIE_NAMES.SESSION_ID, sessionId, {
            ...COOKIE_CONFIG,
            expires: 7,
          });
        }
        if (refreshToken) {
          Cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
            ...COOKIE_CONFIG,
            expires: 30,
          });
        }
        Cookies.set(COOKIE_NAMES.USER, JSON.stringify(user), {
          ...COOKIE_CONFIG,
          expires: 7,
        });

        console.log("Auth cookies set successfully");
      }
    },

    logout(state) {
      console.log("Logout initiated...");

      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.sessionId = null;
      state.refreshToken = null;

      clearAuthCookies();

      console.log("Logout complete");
    },

    hydrate(state) {
      if (typeof window !== "undefined") {
        try {
          const accessToken = Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
          const sessionId = Cookies.get(COOKIE_NAMES.SESSION_ID);
          const refreshToken = Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
          const userStr = Cookies.get(COOKIE_NAMES.USER);

          if (accessToken && userStr) {
            const user = JSON.parse(userStr);
            state.isAuthenticated = true;
            state.user = user;
            state.accessToken = accessToken;
            state.sessionId = sessionId || null;
            state.refreshToken = refreshToken || null;
            console.log("Auth state hydrated from cookies, user:", user);
          } else {
            console.log("No valid auth cookies found");
          }
        } catch (e) {
          console.error("Failed to parse auth data from cookies:", e);
          clearAuthCookies();
        }
      }
      state.hydrated = true;
    },

    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      if (typeof window !== "undefined") {
        Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, action.payload, {
          ...COOKIE_CONFIG,
          expires: 7,
        });
      }
    },

    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          Cookies.set(COOKIE_NAMES.USER, JSON.stringify(state.user), {
            ...COOKIE_CONFIG,
            expires: 7,
          });
        }
      }
    },
  },
});

export const { login, logout, hydrate, updateAccessToken, updateUser } =
  authSlice.actions;
export default authSlice.reducer;