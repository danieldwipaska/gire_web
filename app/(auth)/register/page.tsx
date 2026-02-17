"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, Shield, Target, User } from "lucide-react";
import Field from "@/app/components/form/Field";

export default function RegisterPage() {
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    const e: any = {};
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
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      router.push("/login");
    } catch (err: any) {
      setErrors(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mkChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f: any) => ({ ...f, [id]: e.target.value }));
    setErrors((v: any) => ({ ...v, [id]: "" }));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-300 text-sm">
            Sign in to your PR Reporter account
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          {/* OAuth */}
          {/* <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all">
              <Target className="w-4 h-4" /> GitHub
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all">
              <span className="text-base leading-none font-bold">G</span> Google
            </button>
          </div>

          <div className="relative flex items-center mb-6">
            <div className="flex-1 border-t border-white/20" />
            <span className="px-3 text-xs text-gray-300">
              or continue with email
            </span>
            <div className="flex-1 border-t border-white/20" />
          </div> */}

          {/* Form */}
          <div className="space-y-4">
            <Field
              id="name"
              label="Name"
              type="text"
              placeholder="Enter your name"
              icon={User}
              value={form.name}
              onChange={mkChange("name")}
              error={errors.name}
            />
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
                  onClick={() => setShowPw((v) => !v)}
                  className="text-gray-300 hover:text-white transition-colors text-xs font-medium"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              }
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-linear-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-300 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple-300 hover:text-purple-200 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
