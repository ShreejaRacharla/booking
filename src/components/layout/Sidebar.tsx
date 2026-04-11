import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Clock,
  MapPin,
  Building2,
  Landmark,
  ClipboardList,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/facilities", label: "Facilities", icon: <Landmark size={18} /> },
  { href: "/admin/timeslots", label: "Time Slots", icon: <Clock size={18} /> },
  { href: "/admin/locations", label: "Locations", icon: <MapPin size={18} /> },
  { href: "/admin/clubs", label: "Clubs", icon: <Building2 size={18} /> },
  { href: "/admin/slot-availability", label: "Manage slots", icon: <ClipboardList size={18} /> },
  { href: "/admin/approvals", label: "Approvals", icon: <CheckCircle2 size={18} /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const router = useRouter();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-rotary-royal text-white flex flex-col
          transition-all duration-300
          ${isOpen ? "w-[260px]" : "w-[70px]"}
        `}
      >
        <div className="flex items-center px-1 h-14 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/icon/icon.png"
                className="w-full h-full object-contain"
              />
            </div>

            {isOpen && (
              <span className="text-sm font-semibold">
                Rotary Club
              </span>
            )}
          </div>

          <button
            onClick={onToggle}
            className="rounded-lg hover:bg-white/10"
          >
            {isOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? router.pathname === "/"
                : router.pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                    transition-all
                    ${!isOpen && "justify-center"}
                    ${
                      isActive
                        ? "bg-white/15 text-rotary-gold"
                        : "text-white/70 hover:bg-white/10"
                    }
                  `}
                >
                  {item.icon}

                  <span
                    className={`
                      ml-3 whitespace-nowrap transition-all
                      ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                    `}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {isOpen && (
          <div className="px-4 py-3 border-t border-white/10 text-center text-[11px] text-white/40">
            © 2026 Rotary International
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;