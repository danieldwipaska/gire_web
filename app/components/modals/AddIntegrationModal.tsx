"use client";

import { useState } from "react";
import Modal from "./Modal";
import Button from "../buttons/Button";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

const AddIntegrationModal = ({ open, onClose }: Props) => {
  const [label, setLabel] = useState("Office");
  const [githubUsername, setGithubUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "github",
          label,
          githubUsername,
          accessToken,
          status: "active",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add integration");
      }

      router.refresh();
      onClose();
      setGithubUsername("");
      setAccessToken("");
      setLabel("Office");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add integration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add GitHub Account"
      body={
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-w-[350px]">
          {error && <div className="text-rose-600 text-xs font-medium bg-rose-50 border border-rose-200 rounded-2xl p-3">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Account Label</label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="px-3.5 py-2.5 bg-highlight border border-line rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet text-ink text-sm"
            >
              <option value="Office">Office</option>
              <option value="Freelance">Freelance</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">
              GitHub Username <span className="text-xs text-ink-subtle font-normal">(optional, auto-detected from token)</span>
            </label>
            <input
              type="text"
              className="px-3.5 py-2.5 bg-highlight border border-line rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet text-ink text-sm"
              placeholder="e.g. johndoe"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Personal Access Token</label>
            <input
              type="password"
              required
              className="px-3.5 py-2.5 bg-highlight border border-line rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet text-ink text-sm"
              placeholder="ghp_..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-ink-muted">
              Generate a token with `repo` scope in GitHub Developer Settings. You can connect multiple accounts (e.g., Office &amp; Freelance).
            </p>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Integration"}
            </Button>
          </div>
        </form>
      }
    />
  );
};

export default AddIntegrationModal;
