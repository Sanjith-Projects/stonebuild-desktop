 "use client";

import * as React from "react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
  description?: string;
};

type Props = {
  name: string;
  options: Option[];
  placeholder?: string;
  validation?: RegisterOptions;
   onChange?: (value: string) => void; // ✅ add this
};
 export const TypeaheadField = ({ name, options, placeholder, validation, onChange }: Props) => {
  const { control, setValue, watch } = useFormContext();
  const [open, setOpen] = React.useState(false);
  const fieldValue = watch(name);

  // ✅ Proper useEffect — outside render
  React.useEffect(() => {
    if (options.length > 0 && fieldValue) {
      const match = options.find((opt) => String(opt.value) === String(fieldValue));
      if (!match) {
        // If the current fieldValue isn't valid anymore, reset it
        setValue(name, "");
      }
    }
  }, [options, fieldValue, name, setValue]);

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field }) => {
        const selected = options.find(
          (opt) => String(opt.value) === String(field.value)
        );

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-[15px] rounded-md px-3 py-2 h-[38px]"
              >
                {selected ? (
                  <div className="flex flex-col items-start">
                    <span>{selected.label}</span>
                    {selected.description && (
                      <span className="text-xs text-muted-foreground">
                        {selected.description}
                      </span>
                    )}
                  </div>
                ) : (
                  <span>{placeholder || "Select an option"}</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" sideOffset={4} className="p-0">
              <Command>
                <CommandInput placeholder={`Search ${placeholder || "options"}...`} />
                <CommandList>
                  <CommandEmpty>No option found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        onSelect={() => {
                          field.onChange(opt.value);
                          onChange?.(opt.value);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-[15px]">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[14px] text-muted-foreground">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
};

