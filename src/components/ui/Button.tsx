import React from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rotary-royal text-white hover:bg-rotary-azure focus:ring-rotary-royal",
  secondary:
    "bg-rotary-gold text-rotary-black hover:bg-yellow-400 focus:ring-rotary-gold",
  danger:
    "bg-rotary-cranberry text-white hover:bg-red-700 focus:ring-rotary-cranberry",
  success:
    "bg-rotary-turquoise text-white hover:bg-teal-600 focus:ring-rotary-turquoise",
  ghost:
    "bg-transparent text-rotary-royal border border-rotary-royal hover:bg-rotary-royal hover:text-white focus:ring-rotary-royal",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...rest
}) => (
  <button
    className={`
      inline-flex items-center justify-center font-semibold rounded-lg
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      cursor-pointer select-none
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${fullWidth ? "w-full" : ""}
      ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
      ${className}
    `}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default Button;