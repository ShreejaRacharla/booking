import React from "react";
import { SelectOption } from "../../types";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  placeholder = "Select...",
  error,
  className = "",
  ...rest
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-rotary-black mb-1.5">
        {label}
      </label>
    )}
    <select
      className={`
        w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white
        text-rotary-black text-sm
        focus:outline-none focus:ring-2 focus:ring-rotary-royal focus:border-transparent
        transition-all duration-200 appearance-none
        ${error ? "border-rotary-cranberry" : ""}
        ${className}
      `}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-rotary-cranberry">{error}</p>}
  </div>
);

export default Select;