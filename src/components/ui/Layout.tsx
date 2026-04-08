import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "../../store";
import { hydrate } from "../../store/slices/authSlice";
import Header from "../layout/Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { isAuthenticated, hydrated } = useSelector(
    (s: RootState) => s.auth
  );

  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rotary-royal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen w-full flex flex-col bg-rotary-lightgray">
      <Header />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;