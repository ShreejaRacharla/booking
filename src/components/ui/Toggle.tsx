import React from "react";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center gap-3">
    {label && (
      <span className="text-sm font-medium text-rotary-black">{label}</span>
    )}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-rotary-royal focus:ring-offset-2
        ${checked ? "bg-rotary-turquoise" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
    <span className="text-xs text-rotary-darkgray">
      {checked ? "Active" : "Inactive"}
    </span>
  </div>
);

export default Toggle;