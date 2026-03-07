import React from "react";

type SelectProps = {
  children: React.ReactNode;
  onValueChange: (value: string) => void;
};

export const Select = ({ children, onValueChange }: SelectProps) => {
  return (
    <select
      className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  );
};

export const SelectTrigger = ({ children }: any) => <>{children}</>;

export const SelectValue = ({ placeholder }: { placeholder: string }) => (
  <option value="">{placeholder}</option>
);

export const SelectContent = ({ children }: any) => <>{children}</>;

export const SelectItem = ({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) => <option value={value}>{children}</option>;
