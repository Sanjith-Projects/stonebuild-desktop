 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { postRequest, setSession,  ApiResponse} from "../utils/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
 


  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const payload = {
      token: "checkUser",
      data: {
        username,
        password,
      },
    };

    const response = await postRequest(payload);

    // ✅ Updated checks to match backend response
    if (response.status === "success" && response.token) {
      const user = response.user;
      setSession(response.token, user);
      toast.success("Login successful!");
      router.push(`/${user.company_id}`);
    } else {
      toast.error(response.message || "Invalid credentials");
    }
  } catch (error: any) {
    toast.error(error.message || "Login failed");
  } finally {
    setLoading(false);
  }
};






  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold text-center text-[#103BB5] mb-6">
          StonePay Admin Login
        </h1>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm mb-1">
            Username
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#103BB5] outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#103BB5] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#103BB5] text-white hover:bg-[#256b45]"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
