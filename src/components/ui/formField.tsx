import { Input } from "@/components/ui/input";
import { Controller } from "react-hook-form";

type Props = {
  name: string;
  control: any;
  placeholder?: string;
  type?: string;
};

export function FormField({ name, control, placeholder, type = "text" }: Props) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input {...field} type={type} placeholder={placeholder} />
      )}
    />
  );
}