import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = true,
}) => (
  <div
    className={`
      bg-white rounded-xl shadow-sm border border-gray-100
      ${padding ? "p-5" : ""}
      ${className}
    `}
  >
    {children}
  </div>
);

export default Card;