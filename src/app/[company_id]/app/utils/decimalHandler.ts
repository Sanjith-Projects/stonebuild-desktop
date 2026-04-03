// ---------------- DECIMAL INPUT HANDLER ----------------
export const handleDecimalInput = (
  e: React.ChangeEvent<HTMLInputElement>,
  maxDecimals: number = 2
): string => {
  let value = e.target.value.replace(/[^\d.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
  if (parts.length === 2 && parts[1].length > maxDecimals)
    value = parts[0] + "." + parts[1].substring(0, maxDecimals);
  return value;
};
