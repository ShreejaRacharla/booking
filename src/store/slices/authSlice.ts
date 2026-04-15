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

const decodeJWT = (token: string): { sub?: string; roles?: string[]; sessionId?: string; name?: string; email?: string } | null => {
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

const getRoleFromToken = (token: string): "admin" | "member" => {
  const decoded = decodeJWT(token);
  if (!decoded) return "member";

  const roles = decoded.roles || [];
  
  const hasAdminRole = roles.some((role: string) => 
    role.toUpperCase() === "ADMIN" || role.toUpperCase() === "ROLE_ADMIN"
  );

  return hasAdminRole ? "admin" : "member";
};

const clearAuthCookies = () => {
  if (typeof window === "undefined") return;

  Object.values(COOKIE_NAMES).forEach((cookieName) => {
    Cookies.remove(cookieName, COOKIE_CONFIG);
    Cookies.remove(cookieName, { path: "/" });
    Cookies.remove(cookieName, { path: "" });
    Cookies.remove(cookieName);
  });

  const remaining = Object.values(COOKIE_NAMES)
    .map((name) => ({ name, value: Cookies.get(name) }))
    .filter((c) => c.value);

  if (remaining.length > 0) {
    console.warn("Some cookies still exist:", remaining);
  } else {
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

      if (!actualToken) {
        console.error("No token provided to login action");
        return;
      }

      const decoded = decodeJWT(actualToken);

      if (!decoded) {
        console.error("Failed to decode token");
        return;
      }

      const username = userData.username || decoded.sub || "unknown";
      const roles = decoded.roles || [];
      
      let userId = userData.userId || userData.id;
      
      if (!userId && username) {
        userId = USER_ID_MAP[username];
      }

      if (!userId) {
        console.warn("No userId found! Using username as fallback.");
        userId = username;
      }

      const role = getRoleFromToken(actualToken);

      const user: User = {
        id: userId,
        userId: userId,
        username: username,
        name: userData.name || decoded.name || username.charAt(0).toUpperCase() + username.slice(1),
        email: userData.email || decoded.email || `${username}@rotaryclub.com`,
        role: role, 
        system: userData.system ?? false,
        isActive: userData.isActive ?? true,
        club: userData.club,
        phone: userData.phone,
        roles: roles,
      };

      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = actualToken;
      state.sessionId = sessionId || decoded.sessionId || null;
      state.refreshToken = refreshToken || null;
      state.hydrated = true;

      if (typeof window !== "undefined") {
        clearAuthCookies();

        Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, actualToken, {
          ...COOKIE_CONFIG,
          expires: 7,
        });
        
        if (state.sessionId) {
          Cookies.set(COOKIE_NAMES.SESSION_ID, state.sessionId, {
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
      }
    },

    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.sessionId = null;
      state.refreshToken = null;
      clearAuthCookies();
    },

    hydrate(state) {
      if (typeof window !== "undefined") {
        try {
          const accessToken = Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
          const sessionId = Cookies.get(COOKIE_NAMES.SESSION_ID);
          const refreshToken = Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
          const userStr = Cookies.get(COOKIE_NAMES.USER);

          if (accessToken && userStr) {
            const role = getRoleFromToken(accessToken);
            
            const user = JSON.parse(userStr);
            
            user.role = role;

            state.isAuthenticated = true;
            state.user = user;
            state.accessToken = accessToken;
            state.sessionId = sessionId || null;
            state.refreshToken = refreshToken || null;
            Cookies.set(COOKIE_NAMES.USER, JSON.stringify(user), {
              ...COOKIE_CONFIG,
              expires: 7,
            });
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
      const newToken = action.payload;
      
      const role = getRoleFromToken(newToken);
      
      state.accessToken = newToken;
      
      if (state.user) {
        state.user.role = role;
        
        if (typeof window !== "undefined") {
          Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, newToken, {
            ...COOKIE_CONFIG,
            expires: 7,
          });
          
          Cookies.set(COOKIE_NAMES.USER, JSON.stringify(state.user), {
            ...COOKIE_CONFIG,
            expires: 7,
          });
        }
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