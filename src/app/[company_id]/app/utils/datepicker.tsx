 "use client";

import * as React from "react";
import { Controller, useFormContext, RegisterOptions } from "react-hook-form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";

type Props = {
  name: string;
  validation?: RegisterOptions;
};

export const DatePickerField = ({ name, validation }: Props) => {
  const { control } = useFormContext();
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<{ left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = triggerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ left: r.left + window.scrollX, width: r.width });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field }) => {
        // convert stored string to Date object
        const parsedDate =
          field.value && typeof field.value === "string"
            ? parse(field.value, "dd/MM/yyyy", new Date())
            : field.value instanceof Date
            ? field.value
            : undefined;

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={triggerRef as any}
                variant="outline"
                className="w-full justify-start text-left text-[15px] rounded-md px-3 py-2 h-[38px] transition disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-50 outline-none"
              >
                <Calendar className="mr-2 h-4 w-4 opacity-60" />
                {parsedDate ? format(parsedDate, "dd/MM/yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={4}
              className="p-0"
              style={
                rect
                  ? {
                      position: "absolute",
                      left: rect.left,
                      width: rect.width,
                      zIndex: 9999,
                    }
                  : undefined
              }
            >
              <CalendarComponent
                mode="single"
                selected={parsedDate}
                onSelect={(val) => {
                  if (val) {
                    field.onChange(format(val, "dd/MM/yyyy")); // store formatted string
                  } else {
                    field.onChange("");
                  }
                  setOpen(false);
                }}
                 formatters={{
                  formatCaption: (date) => format(date, "MMMM yyyy"),
                  formatWeekdayName: (day) => format(day, "EEEEE"),
                  formatDay: (day) => format(day, "d"), // keeps days numeric
                }}
              />
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
};
