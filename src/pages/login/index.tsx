import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Loader2, AlertCircle } from "lucide-react";
import { RootState } from "../../store";
import { login, hydrate } from "../../store/slices/authSlice";
import { Button, Input, Card } from "../../components";
import customAxios from "../../utils/customAxios";
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
  const { isAuthenticated, hydrated } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hydrated, isAuthenticated, router]);

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
      const response = await customAxios.post("/auth/login", {
        username: username.trim(),
        password: password,
      });

      console.log("Login response:", response.data);

          router.push('/admin/dashboard') 


      const { token, sessionId, refreshToken } = response.data;

      if (!token) {
        throw new Error("Invalid response from server: missing token");
      }

      const decoded = decodeJWT(token);
      console.log("Decoded token:", decoded);

      if (!decoded || !decoded.sub) {
        throw new Error("Invalid token format");
      }

      let userRole: UserRole = "member";
      if (decoded.roles && Array.isArray(decoded.roles)) {
        const roleString = decoded.roles[0]?.toLowerCase();
        if (roleString === "admin") {
          userRole = "admin";
        }
      }

      const user: User = {
        id: decoded.sub,
        username: decoded.sub,
        name: decoded.sub.charAt(0).toUpperCase() + decoded.sub.slice(1),
        email: `${decoded.sub}@rotaryclub.com`,
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

      console.log("Login successful, redirecting to dashboard...");

      setTimeout(() => {
        router.push("/");
      }, 100);
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
          errorMessage =
            data?.message || "Bad request. Please check your input.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage =
            data?.message || `Error ${status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage =
          "No response from server. Please check your internet connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-rotary-royal via-rotary-azure to-rotary-royal p-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src="/assets/icon/icon.png"
                className="w-full h-full object-contain"
                alt="Rotary Club Logo"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Rotary Club</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Hall Booking Management
          </p>
        </div>

        <Card className="shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-lg font-bold text-rotary-royal text-center mb-1">
              Sign In
            </h2>

            {error && (
              <div className="p-3 rounded-lg bg-rotary-cranberry/10 border border-rotary-cranberry/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rotary-cranberry shrink-0 mt-0.5" />
                  <p className="text-xs text-rotary-cranberry flex-1">{error}</p>
                </div>
              </div>
            )}

            <Input
              label="Username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}