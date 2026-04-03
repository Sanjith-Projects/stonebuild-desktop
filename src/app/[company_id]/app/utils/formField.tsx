 "use client";

import { useFormContext, Controller, RegisterOptions } from "react-hook-form";
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { TypeaheadField } from "./typeheadField";
 import ToggleSwitch from "@/components/ui/switch";  // <-- NEW

type Option = {
  label: string;
  value: string;
  description?: string;
};

type Props = {
  name: string;
  type:
    | "input"
    | "textarea"
    | "radio"
    | "checkbox"
    | "datepicker"
    | "typeahead"
    | "toggle";        // 🔹 NEW
  placeholder?: string;
  options?: Option[] | string[];
  validation?: RegisterOptions;
  readonly?: boolean;
  disabled?: boolean;
  className?: string;
};

// 🔹 helper: normalize string[] | Option[] into Option[]
const normalizeOptions = (options?: Option[] | string[]): Option[] => {
  if (!options) return [];
  if (typeof options[0] === "string") {
    return (options as string[]).map((o) => ({ label: o, value: o }));
  }
  return options as Option[];
};

export const FormField = ({
  name,
  type,
  placeholder,
  options,
  validation,
  readonly = false,
  disabled = false,
  className,
}: Props) => {
  const { register, control } = useFormContext();

  const baseInputClass =
    "border border-gray-300 focus:border-[#103BB5] focus:ring-1 focus:ring-[#103BB5] text-[16px] placeholder:text-[15px] rounded-md w-full px-3 py-2 h-[38px] transition disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-50 outline-none";

  switch (type) {
    case "input":
      return (
        <Controller
          name={name}
          control={control}
          rules={validation}
          render={({ field }) => {
            const cls = className ?? "";

            // detect a limit class like "limit-10" and set maxLength prop
            const limitMatch = cls.match(/limit-(\d+)/);
            const computedMaxLength = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

            const isOnlyNumbers =
              cls.includes("only-numbers") || cls.includes("only-number") || cls.includes("only-numbers");
            const isNumbersDecimal = cls.includes("numbers-decimal");
            const isOnlyAlphabets = cls.includes("only-alphabets");
            const isAlphanumeric = cls.includes("alphanumeric");
            const isNoSpace = cls.includes("no-space");
            const isUppercase = cls.includes("uppercase");
            const isCapitalize = cls.includes("capitalize");
            const isAlnumUpper = cls.includes("alphanumeric-uppercase");

            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              let value = e.target.value;

              if (isOnlyNumbers) {
                value = value.replace(/[^0-9]/g, "");
              }

              if (isNumbersDecimal) {
                value = value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                if (parts.length > 2) value = parts[0] + "." + parts[1];
                if (parts[1]?.length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
              }

              if (isOnlyAlphabets) {
                value = value.replace(/[^A-Za-z\s]/g, "");
              }

              if (isAlphanumeric) {
                value = value.replace(/[^A-Za-z0-9]/g, "");
              }

              if (isNoSpace) {
                value = value.replace(/\s+/g, "");
              }

              if (isUppercase) {
                value = value.toUpperCase();
              }

              if (isCapitalize) {
                value = value
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase());
              }

              if (isAlnumUpper) {
                value = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
              }

              if (computedMaxLength !== undefined && computedMaxLength > 0) {
                value = value.slice(0, computedMaxLength);
              }

              field.onChange(value);
            };

            return (
              <input
                {...field}
                placeholder={placeholder}
                className={`${baseInputClass} ${className ?? ""}`}
                autoComplete="off"
                readOnly={readonly}
                disabled={disabled}
                onChange={handleInputChange}
                maxLength={computedMaxLength}
              />
            );
          }}
        />
      );

    case "textarea":
      return (
        <textarea
          {...register(name, validation)}
          placeholder={placeholder}
          className={`${baseInputClass} h-[90px] resize-none`}
          readOnly={readonly}
          disabled={disabled}
        />
      );

    case "radio": {
      const opts = normalizeOptions(options);
      return (
        <div className="flex gap-4 text-[15px]">
          {opts.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-1 ${readonly || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                {...register(name, validation)}
                value={opt.value}
                disabled={readonly || disabled}
                className="accent-[#103BB5] w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case "checkbox": {
      const opts = normalizeOptions(options);
      return (
        <div className="flex gap-4 text-[15px]">
          {opts.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-1 ${readonly || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                {...register(name, validation)}
                value={opt.value}
                disabled={readonly || disabled}
                className="accent-[#103BB5] w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case "datepicker":
      return (
        <Controller
          name={name}
          control={control}
          rules={validation}
          defaultValue={format(new Date(), "dd/MM/yyyy")}
          render={({ field }) => {
            const today = new Date();
            const selectedDate =
              field.value && typeof field.value === "string"
                ? (() => {
                    const [day, month, year] = field.value.split("/");
                    return new Date(+year, +month - 1, +day);
                  })()
                : today;

            return (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left border border-transparent ${baseInputClass} flex items-center gap-2`}
                    disabled={readonly || disabled}
                  >
                    <Calendar className="h-4 w-4 text-[#103BB5]" />
                    <span>{format(selectedDate, "dd/MM/yyyy")}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(val) => {
                      if (!readonly && !disabled) {
                        field.onChange(val ? format(val, "dd/MM/yyyy") : "");
                      }
                    }}
                    disabled={readonly || disabled}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            );
          }}
        />
      );

    case "typeahead":
      return (
        <TypeaheadField
          name={name}
          options={normalizeOptions(options)}
          placeholder={placeholder}
          validation={validation}
        />
      );

   case "toggle":
  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field }) => {
        const checked =
          field.value === true ||
          field.value === 1 ||
          field.value === "1";

        const handleChange = (val: boolean) => {
          if (typeof field.value === "number") {
            field.onChange(val ? 1 : 0);
          } else if (typeof field.value === "string") {
            field.onChange(val ? "1" : "0");
          } else {
            field.onChange(val);
          }
        };

        return (
          <div
            className={`flex items-center gap-2 ${
              readonly || disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ToggleSwitch
              checked={checked}
              disabled={readonly || disabled}
              onChange={handleChange}
            />
            {placeholder && <span className="text-[15px]">{placeholder}</span>}
          </div>
        );
      }}
    />
  );

    default:
      return null;
  }
};
