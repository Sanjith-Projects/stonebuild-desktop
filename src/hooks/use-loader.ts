import { useState } from "react";

export function useLoader() {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return {
    loading,
    showLoader,
    hideLoader,
  };
}