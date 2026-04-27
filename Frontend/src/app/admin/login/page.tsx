"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.admin.login({ username: email, password });
      localStorage.setItem("cribb_admin_token", res.access_token);
      localStorage.setItem("cribb_admin_profile", JSON.stringify(res.admin));
      router.push("/admin");
    } catch {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1923] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#FF6B35]" />
          </div>
          <h1 className="text-white" style={{ fontSize: "24px", fontWeight: 800 }}>
            cribb <span className="text-[#FF6B35]">admin</span>
          </h1>
          <p className="text-white/30 mt-1" style={{ fontSize: "13px" }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        <div className="bg-[#1B2D45] rounded-2xl border border-white/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/50" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="admin@findyourcribb.com"
                required
                className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-[#FF6B35]/40 focus:outline-none transition-all"
                style={{ fontSize: "14px" }}
              />
            </div>

            <div>
              <label className="text-white/50" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  className="w-full mt-1.5 px-4 py-2.5 pr-10 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-[#FF6B35]/40 focus:outline-none transition-all"
                  style={{ fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 translate-y-[-25%] text-white/20 hover:text-white/40 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-2 text-white/30" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                Use the password your team set up. Strong passwords usually include an uppercase letter, a number, and a symbol.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 bg-[#E71D36]/10 text-[#E71D36] px-4 py-2.5 rounded-xl"
                  style={{ fontSize: "12px" }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55e2e] disabled:opacity-50 transition-all"
              style={{ fontSize: "14px", fontWeight: 700 }}
            >
              {isLoading ? "Authenticating..." : "Log in to Admin"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-white/15" style={{ fontSize: "11px" }}>
          cribb admin panel · not for public use
        </p>
      </div>
    </div>
  );
}
