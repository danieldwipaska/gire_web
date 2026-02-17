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
      // Reset form
      setGithubUsername("");
      setAccessToken("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add GitHub Integration"
      body={
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-w-[350px]">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">GitHub Username</label>
            <input
              type="text"
              required
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="e.g. johndoe"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Personal Access Token</label>
            <input
              type="password"
              required
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="ghp_..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Generate a token with `repo` scope in GitHub Developer Settings.
            </p>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
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
