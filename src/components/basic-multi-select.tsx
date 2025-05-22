"use client";

import React from "react";
import { cn } from "@/lib/utils"; // For styling, if needed

interface BasicMultiSelectOption {
  value: string;
  label: string;
}

interface BasicMultiSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: BasicMultiSelectOption[];
  // `value` prop should be string[] for react-hook-form compatibility with multi-select
  // `onChange` prop should handle string[] for react-hook-form
  // We will manage this conversion internally or expect the form controller to handle it.
  // For react-hook-form, the `field.value` will be an array of strings.
  // The HTML select element's `value` is a single string, but when `multiple` is true,
  // `selectedOptions` gives a collection.
}

export function BasicMultiSelect({
  options,
  className,
  value, // This will be string[] from react-hook-form
  onChange,
  ...props
}: BasicMultiSelectProps) {
  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValues = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    // Call the onChange prop (from react-hook-form's field) with the array of selected values
    if (onChange) {
      // Create a synthetic event or pass the values directly if onChange expects that.
      // For react-hook-form, passing the array of values is typical for custom components.
      const syntheticEvent = {
        target: { value: selectedValues },
        // type: 'change', // Not strictly necessary for RHF
      } as unknown as React.ChangeEvent<HTMLSelectElement>; // Cast to satisfy, RHF handles it
      onChange(syntheticEvent); // RHF expects an event or the value itself
    }
  };

  // Ensure `value` is always an array for consistent checking with `includes`
  const currentSelectedValues = Array.isArray(value) ? value : [];

  return (
    <select
      multiple
      {...props}
      value={currentSelectedValues} // HTML select expects string[] for `value` when multiple
      onChange={handleSelectChange}
      className={cn(
        "flex h-auto min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      // Size attribute can be used to show more items, e.g., size={5}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
