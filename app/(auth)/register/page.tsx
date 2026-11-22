"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, Shield, User } from "lucide-react";
import Field from "@/app/components/form/Field";

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    const e: RegisterErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
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

      router.push("/onboarding/workspace");
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
    (id: "name" | "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [id]: e.target.value }));
      setErrors((v) => ({ ...v, [id]: "", form: "" }));
    };

  return (
    <div className="relative min-h-screen bg-canvas flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Ambient Pastel Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 w-96 h-96 rounded-full bg-brand-mint/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-brand-violet/15 blur-3xl animate-float-reverse"
      />

      <div className="relative max-w-md w-full animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-[0_8px_20px_rgba(28,28,31,0.18)] text-white font-bold text-xl">
            G
          </div>
          <h2 className="text-2xl font-bold text-ink mb-1 tracking-tight">
            Create Super User Account
          </h2>
          <p className="text-ink-muted text-sm">
            Register as a Super User to create Workspaces and manage your team
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-line rounded-3xl p-8 shadow-[0_12px_40px_rgba(28,28,31,0.08)]"
        >
          {errors.form && (
            <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-3 font-medium">
              {errors.form}
            </div>
          )}

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
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-ink-muted hover:text-ink transition-colors text-xs font-semibold cursor-pointer"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-ink hover:bg-ink-hover active:scale-[0.99] text-white py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_18px_rgba(28,28,31,0.18)]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Creating account...
              </>
            ) : (
              "Create Super User"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-violet hover:text-brand-blue font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
