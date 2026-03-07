import React from "react";

type Props = {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};

export const Label = ({ children, htmlFor, className = "" }: Props) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
    </label>
  );
};
