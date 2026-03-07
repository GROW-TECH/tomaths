import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className = "" }: Props) => {
  return (
    <div className={`bg-white rounded-xl shadow ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "" }: Props) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
