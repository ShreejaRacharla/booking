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
      action: PayloadAction<
        User & {
          accessToken?: string;
          sessionId?: string;
          refreshToken?: string;
        }
      >
    ) {
      const { accessToken, sessionId, refreshToken, ...userData } = action.payload;

      const user: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        system: userData.system,
        isActive: userData.isActive,
        club: userData.club,
        phone: userData.phone,
      };

      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = accessToken || null;
      state.sessionId = sessionId || null;
      state.refreshToken = refreshToken || null;
      state.hydrated = true;

      if (typeof window !== "undefined") {
        clearAuthCookies();

        if (accessToken) {
          Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
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
            console.log("Auth state hydrated from cookies");
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