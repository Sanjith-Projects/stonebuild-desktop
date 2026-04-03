const BASE_URL = "https://api.stonebase.in"; // change to your PHP backend

type ApiOptions = {
  url: string;
  method?: "POST" | "GET" | "PUT" | "DELETE";
  data?: any;
};

export async function apiRequest({ url, method = "POST", data }: ApiOptions) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data) : undefined,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Something went wrong");
    }

    return result;
  } catch (error: any) {
    throw error;
  }
}