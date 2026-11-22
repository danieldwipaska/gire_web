"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Cloud,
  Database,
  HardDrive,
  Server,
  Trash2,
} from "lucide-react";
import { IStorageIntegration, StorageProviderType } from "@/lib/types";
import Button from "../buttons/Button";

interface Props {
  integrations: IStorageIntegration[];
  onChange: (nextIntegrations: IStorageIntegration[]) => void;
}

export default function StorageIntegrationsPanel({
  integrations,
  onChange,
}: Props) {
  const r2Existing =
    integrations.find((i) => i.provider === "cloudflare_r2") || null;
  const gcpExisting =
    integrations.find((i) => i.provider === "gcp_gcs") || null;

  const activeIntegration = integrations.find((i) => i.isActive) || null;
  const activeProvider: "local" | StorageProviderType = activeIntegration
    ? activeIntegration.provider
    : "local";

  const [r2AccountId, setR2AccountId] = useState(
    r2Existing?.r2AccountId || "",
  );
  const [r2Endpoint, setR2Endpoint] = useState(r2Existing?.r2Endpoint || "");
  const [r2Bucket, setR2Bucket] = useState(r2Existing?.bucket || "");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState("");
  const [r2PublicUrl, setR2PublicUrl] = useState(r2Existing?.publicUrl || "");
  const [r2Prefix, setR2Prefix] = useState(r2Existing?.prefix || "notes");
  const [r2Saving, setR2Saving] = useState(false);

  const [gcpBucket, setGcpBucket] = useState(gcpExisting?.bucket || "");
  const [gcpServiceJson, setGcpServiceJson] = useState("");
  const [gcpPublicUrl, setGcpPublicUrl] = useState(
    gcpExisting?.publicUrl || "",
  );
  const [gcpPrefix, setGcpPrefix] = useState(gcpExisting?.prefix || "notes");
  const [gcpSaving, setGcpSaving] = useState(false);

  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshFromApi = async () => {
    const res = await fetch("/api/storage-integrations");
    if (res.ok) {
      const data = await res.json();
      onChange(data.integrations || []);
    }
  };

  const handleSaveR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setR2Saving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/storage-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloudflare_r2",
          bucket: r2Bucket,
          prefix: r2Prefix,
          publicUrl: r2PublicUrl,
          r2AccountId,
          r2Endpoint,
          r2AccessKeyId,
          r2SecretAccessKey,
          activate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save Cloudflare R2 config");
      }

      setR2AccessKeyId("");
      setR2SecretAccessKey("");
      await refreshFromApi();
      setNotice("Cloudflare R2 verified, saved, and set as active storage.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save Cloudflare R2 config",
      );
    } finally {
      setR2Saving(false);
    }
  };

  const handleSaveGcp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGcpSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/storage-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gcp_gcs",
          bucket: gcpBucket,
          prefix: gcpPrefix,
          publicUrl: gcpPublicUrl,
          gcpServiceAccountJson: gcpServiceJson,
          activate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save GCP Storage config");
      }

      setGcpServiceJson("");
      await refreshFromApi();
      setNotice(
        "Google Cloud Storage verified, saved, and set as active storage.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save GCP Storage config",
      );
    } finally {
      setGcpSaving(false);
    }
  };

  const handleSwitchProvider = async (
    provider: "local" | StorageProviderType,
  ) => {
    setSwitching(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/storage-integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch active storage");
      }
      await refreshFromApi();
      setNotice(
        provider === "local"
          ? "Switched to Local Server storage (uploads/)."
          : `Switched active image storage to ${provider === "cloudflare_r2" ? "Cloudflare R2" : "Google Cloud Storage"}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to switch active storage",
      );
    } finally {
      setSwitching(false);
    }
  };

  const handleDelete = async (provider: StorageProviderType) => {
    const label =
      provider === "cloudflare_r2"
        ? "Cloudflare R2"
        : "Google Cloud Storage (GCP)";
    if (!confirm(`Remove ${label} configuration?`)) return;

    setSwitching(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/storage-integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove configuration");
      }
      await refreshFromApi();
      if (provider === "cloudflare_r2") {
        setR2AccountId("");
        setR2Endpoint("");
        setR2Bucket("");
        setR2PublicUrl("");
        setR2Prefix("notes");
      } else {
        setGcpBucket("");
        setGcpPublicUrl("");
        setGcpPrefix("notes");
      }
      setNotice(`${label} removed.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove configuration",
      );
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Active Storage Status Banner */}
      <div className="bg-card border border-line rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
              activeProvider === "local"
                ? "bg-highlight border-line text-ink"
                : "bg-brand-violet/12 border-brand-violet/25 text-brand-violet"
            }`}
          >
            {activeProvider === "local" ? (
              <Server className="w-5 h-5" />
            ) : (
              <Cloud className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink">
                Note Image Storage Destination
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-mint/25 text-brand-mint-ink border border-brand-mint/50">
                Active:{" "}
                {activeProvider === "cloudflare_r2"
                  ? `Cloudflare R2 (${activeIntegration?.bucket})`
                  : activeProvider === "gcp_gcs"
                    ? `GCP Storage (${activeIntegration?.bucket})`
                    : "Local Server (uploads/)"}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {activeProvider === "local"
                ? "Neither Cloudflare R2 nor GCP Storage is active. Images pasted or uploaded in Notes are automatically saved on this VPS server."
                : "Images pasted or uploaded in Notes will be stored directly in your active cloud bucket. Leave Public Base URL blank if your bucket is private—GiRe will serve them securely."}
            </p>
          </div>
        </div>

        {activeProvider !== "local" && (
          <button
            type="button"
            disabled={switching}
            onClick={() => void handleSwitchProvider("local")}
            className="px-4 py-2 rounded-full bg-highlight hover:bg-white border border-line text-xs font-semibold text-ink flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
          >
            <HardDrive className="w-3.5 h-3.5" />
            Use Local Server Instead
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 font-medium">
          {error}
        </div>
      )}
      {notice && (
        <div className="text-xs text-brand-mint-ink bg-brand-mint/20 border border-brand-mint/40 rounded-2xl px-4 py-3 font-medium">
          {notice}
        </div>
      )}

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cloudflare R2 Card */}
        <div className="bg-card border border-line rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue/15 border border-brand-blue/25 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-brand-blue-ink" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">
                  Cloudflare R2
                </h4>
                <p className="text-xs text-ink-muted">
                  S3-compatible zero-egress object storage
                </p>
              </div>
            </div>

            {r2Existing?.isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-mint/25 text-brand-mint-ink border border-brand-mint/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : r2Existing ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card text-ink border border-canvas">
                Configured (Inactive)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-highlight text-ink-subtle border border-line">
                Not Set
              </span>
            )}
          </div>

          <form onSubmit={handleSaveR2} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Account ID
                </label>
                <input
                  type="text"
                  value={r2AccountId}
                  onChange={(e) => setR2AccountId(e.target.value)}
                  placeholder="e.g. a1b2c3d4e5f6..."
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Bucket Name *
                </label>
                <input
                  type="text"
                  required
                  value={r2Bucket}
                  onChange={(e) => setR2Bucket(e.target.value)}
                  placeholder="e.g. gire-notes-assets"
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                S3 Endpoint{" "}
                <span className="text-ink-subtle font-normal">
                  (optional if Account ID is filled)
                </span>
              </label>
              <input
                type="url"
                value={r2Endpoint}
                onChange={(e) => setR2Endpoint(e.target.value)}
                placeholder="https://<account_id>.r2.cloudflarestorage.com"
                className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Access Key ID {r2Existing ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="text"
                  required={!r2Existing}
                  value={r2AccessKeyId}
                  onChange={(e) => setR2AccessKeyId(e.target.value)}
                  placeholder={
                    r2Existing?.r2AccessKeyIdMasked || "R2 Access Key ID"
                  }
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Secret Access Key {r2Existing ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  required={!r2Existing}
                  value={r2SecretAccessKey}
                  onChange={(e) => setR2SecretAccessKey(e.target.value)}
                  placeholder={
                    r2Existing?.hasSecret
                      ? "•••••••• (saved)"
                      : "R2 Secret Access Key"
                  }
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Public Base URL{" "}
                  <span className="text-ink-subtle font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={r2PublicUrl}
                  onChange={(e) => setR2PublicUrl(e.target.value)}
                  placeholder="https://cdn.example.com"
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Folder Prefix
                </label>
                <input
                  type="text"
                  value={r2Prefix}
                  onChange={(e) => setR2Prefix(e.target.value)}
                  placeholder="notes"
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-card">
              <div className="flex items-center gap-2">
                {r2Existing && !r2Existing.isActive && (
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => void handleSwitchProvider("cloudflare_r2")}
                    className="px-3.5 py-1.5 rounded-full bg-highlight hover:bg-white border border-line text-xs font-semibold text-ink cursor-pointer"
                  >
                    Set Active
                  </button>
                )}
                {r2Existing && (
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => void handleDelete("cloudflare_r2")}
                    className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <Button type="submit" disabled={r2Saving}>
                {r2Saving ? "Verifying..." : "Save & Activate R2"}
              </Button>
            </div>
          </form>
        </div>

        {/* GCP Cloud Storage Card */}
        <div className="bg-card border border-line rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-brand-violet" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink">
                  Google Cloud Storage (GCP)
                </h4>
                <p className="text-xs text-ink-muted">
                  GCS bucket with Service Account authentication
                </p>
              </div>
            </div>

            {gcpExisting?.isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-mint/25 text-brand-mint-ink border border-brand-mint/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : gcpExisting ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card text-ink border border-canvas">
                Configured (Inactive)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-highlight text-ink-subtle border border-line">
                Not Set
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGcp} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Bucket Name *
              </label>
              <input
                type="text"
                required
                value={gcpBucket}
                onChange={(e) => setGcpBucket(e.target.value)}
                placeholder="e.g. my-gire-assets-bucket"
                className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Service Account JSON{" "}
                {gcpExisting ? (
                  <span className="text-ink-subtle font-normal">
                    (leave blank to keep {gcpExisting.gcpClientEmail})
                  </span>
                ) : (
                  "*"
                )}
              </label>
              <textarea
                rows={4}
                required={!gcpExisting}
                value={gcpServiceJson}
                onChange={(e) => setGcpServiceJson(e.target.value)}
                placeholder={
                  gcpExisting
                    ? `Saved service account: ${gcpExisting.gcpClientEmail}\nPaste new JSON here only if rotating keys.`
                    : '{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----...",\n  "client_email": "...@....iam.gserviceaccount.com"\n}'
                }
                className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs font-mono text-ink placeholder-ink-subtle"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Public Base URL{" "}
                  <span className="text-ink-subtle font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={gcpPublicUrl}
                  onChange={(e) => setGcpPublicUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/my-bucket"
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Folder Prefix
                </label>
                <input
                  type="text"
                  value={gcpPrefix}
                  onChange={(e) => setGcpPrefix(e.target.value)}
                  placeholder="notes"
                  className="w-full px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink placeholder-ink-subtle"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-card">
              <div className="flex items-center gap-2">
                {gcpExisting && !gcpExisting.isActive && (
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => void handleSwitchProvider("gcp_gcs")}
                    className="px-3.5 py-1.5 rounded-full bg-highlight hover:bg-white border border-line text-xs font-semibold text-ink cursor-pointer"
                  >
                    Set Active
                  </button>
                )}
                {gcpExisting && (
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => void handleDelete("gcp_gcs")}
                    className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <Button type="submit" disabled={gcpSaving}>
                {gcpSaving ? "Verifying..." : "Save & Activate GCP"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
