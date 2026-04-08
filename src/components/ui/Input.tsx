import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...rest
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-rotary-black mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white
          text-rotary-black text-sm placeholder-rotary-midgray
          focus:outline-none focus:ring-2 focus:ring-rotary-royal focus:border-transparent
          transition-all duration-200
          ${error ? "border-rotary-cranberry ring-1 ring-rotary-cranberry" : ""}
          ${className}
        `}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-rotary-cranberry">{error}</p>
      )}
    </div>
  );
};

export default Input;