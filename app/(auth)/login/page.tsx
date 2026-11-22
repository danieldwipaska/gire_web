"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, Shield } from "lucide-react";
import Field from "@/app/components/form/Field";

interface LoginErrors {
  email?: string;
  password?: string;
  form?: string;
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    const e: LoginErrors = {};
    if (!form.email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      router.push(data.hasWorkspace ? "/dashboard" : "/onboarding/workspace");
      router.refresh();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const mkChange =
    (id: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [id]: e.target.value }));
      setErrors((v) => ({ ...v, [id]: "", form: "" }));
    };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm text-white font-bold text-xl">
            G
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm">
            Sign in to your GiRe account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#131924] border border-slate-800/80 rounded-2xl p-8 shadow-xl"
        >
          {errors.form && (
            <div className="mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-3">
              {errors.form}
            </div>
          )}

          <div className="space-y-4">
            <Field
              id="email"
              label="Email address"
              type="email"
              placeholder="Enter your email"
              icon={Mail}
              value={form.email}
              onChange={mkChange("email")}
              error={errors.email}
            />
            <Field
              id="password"
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              icon={Shield}
              value={form.password}
              onChange={mkChange("password")}
              error={errors.password}
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-slate-400 hover:text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have a Super User account?{" "}
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Create one
          </Link>
        </p>
        <div className="text-center mt-3">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
