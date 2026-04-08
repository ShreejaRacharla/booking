import React from "react";

type BadgeVariant =
  | "available"
  | "tempHold"
  | "booked"
  | "blocked"
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "conflict";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  available:
    "bg-rotary-turquoise/15 text-rotary-turquoise border-rotary-turquoise/30",
  tempHold: "bg-rotary-gold/15 text-yellow-700 border-rotary-gold/30",
  booked: "bg-rotary-royal/15 text-rotary-royal border-rotary-royal/30",
  blocked:
    "bg-rotary-cranberry/15 text-rotary-cranberry border-rotary-cranberry/30",
  active:
    "bg-rotary-turquoise/15 text-rotary-turquoise border-rotary-turquoise/30",
  inactive: "bg-gray-100 text-rotary-darkgray border-gray-300",
  pending: "bg-rotary-gold/15 text-yellow-700 border-rotary-gold/30",
  approved:
    "bg-rotary-turquoise/15 text-rotary-turquoise border-rotary-turquoise/30",
  rejected:
    "bg-rotary-cranberry/15 text-rotary-cranberry border-rotary-cranberry/30",
  paid: "bg-rotary-royal/15 text-rotary-royal border-rotary-royal/30",
  conflict:
    "bg-rotary-cranberry/15 text-rotary-cranberry border-rotary-cranberry/30",
};

const Badge: React.FC<BadgeProps> = ({ variant, children }) => (
  <span
    className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
      ${variantClasses[variant]}
    `}
  >
    {children}
  </span>
);

export default Badge;