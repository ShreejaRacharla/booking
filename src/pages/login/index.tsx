import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { RootState } from "../../store";
import { login, hydrate } from "../../store/slices/authSlice";
import { login as apiLogin } from "../../services/api";
import { User, UserRole } from "../../types";

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, hydrated, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
      router.replace(redirectPath);
    }
  }, [hydrated, isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin({
        username: username.trim(),
        password: password,
      });

      const { token, sessionId, refreshToken } = response.data;

      if (!token) {
        throw new Error("Invalid response from server: missing token");
      }

      const decoded = decodeJWT(token);

      if (!decoded || !decoded.sub) {
        throw new Error("Invalid token format");
      }

      let userRole: UserRole = "member";
      if (decoded.roles && Array.isArray(decoded.roles)) {
        const roleString = decoded.roles[0]?.toLowerCase();
        if (roleString === "admin") {
          userRole = "admin";
        } else if (roleString === "member") {
          userRole = "member";
        }
      }

      const user: User = {
        id: decoded.sub,
        username: decoded.sub,
        name: decoded.name || decoded.sub.charAt(0).toUpperCase() + decoded.sub.slice(1),
        email: decoded.email || `${decoded.sub}@rotaryclub.com`,
        role: userRole,
        system: false,
      };

      dispatch(
        login({
          ...user,
          accessToken: token,
          sessionId,
          refreshToken,
        })
      );

      const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
      
      await router.replace(redirectPath);
      
    } catch (err: any) {
      console.error("Login failed:", err);

      let errorMessage = "An unexpected error occurred";

      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        errorMessage = `Cannot connect to server. Please check if the backend is running.`;
      } else if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401 || status === 403) {
          errorMessage = data?.message || "Invalid username or password";
        } else if (status === 400) {
          errorMessage = data?.message || "Bad request. Please check your input.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = data?.message || `Error ${status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your internet connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-rotary-royal via-rotary-azure to-rotary-royal">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center relative p-4 from-rotary-royal via-rotary-azure to-rotary-royal">
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-rotary-turquoise/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-rotary-gold/20 blur-[120px]" />

      <main className="w-full max-w-md p-8 rounded-2xl z-10 animate-fade-in relative overflow-hidden bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rotary-azure via-rotary-royal to-rotary-gold" />

        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              <img
                src="/assets/icon/icon.png"
                className="w-full h-full object-contain"
                alt="Rotary Club Logo"
              />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-rotary-royal">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your booking account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-rotary-royal focus:ring-1 focus:ring-rotary-royal outline-none transition-all placeholder:text-gray-400"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-rotary-royal focus:ring-1 focus:ring-rotary-royal outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 bg-rotary-royal hover:bg-rotary-azure text-white rounded-lg font-medium shadow-lg shadow-rotary-royal/25 transition-all transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-rotary-azure active:border-b-0 active:translate-y-[4px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Rotary Club Hall Booking Management
        </p>
      </main>
    </div>
  );
}