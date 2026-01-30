import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const Input = ({ className = "", ...props }: Props) => {
  return (
    <input
      {...props}
      className={`border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
};
