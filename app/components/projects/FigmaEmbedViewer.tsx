"use client";

import { useState } from "react";
import {
  ExternalLink,
  Figma,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
} from "lucide-react";
import { IFigmaLink } from "@/lib/types";
import { isValidFigmaUrl, toFigmaEmbedUrl } from "@/lib/utils";
import Button from "../buttons/Button";

interface Props {
  figmaLinks: IFigmaLink[];
  onSaveLinks?: (nextLinks: IFigmaLink[]) => Promise<void>;
  readOnly?: boolean;
}

export default function FigmaEmbedViewer({
  figmaLinks,
  onSaveLinks,
  readOnly = false,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"design" | "prototype">("design");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const safeIndex =
    selectedIndex >= figmaLinks.length ? Math.max(0, figmaLinks.length - 1) : selectedIndex;
  const activeLink = figmaLinks[safeIndex];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveLinks) return;

    const trimmedUrl = url.trim();
    if (!isValidFigmaUrl(trimmedUrl)) {
      setError("Please enter a valid https://www.figma.com/... URL");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const nextLinks: IFigmaLink[] = [
        ...figmaLinks,
        {
          title: title.trim() || (kind === "prototype" ? "Prototype" : "Design"),
          url: trimmedUrl,
          kind,
        },
      ];
      await onSaveLinks(nextLinks);
      setSelectedIndex(nextLinks.length - 1);
      setTitle("");
      setUrl("");
      setKind("design");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Figma link");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (idx: number) => {
    if (!onSaveLinks) return;
    setSaving(true);
    setError("");
    try {
      const nextLinks = figmaLinks.filter((_, i) => i !== idx);
      await onSaveLinks(nextLinks);
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2E2E2] rounded-2xl p-3 shadow-[0_2px_10px_rgba(28,28,31,0.03)]">
        <div className="flex flex-wrap items-center gap-2">
          {figmaLinks.length === 0 ? (
            <span className="text-xs text-[#6E6E77] px-2">
              No Figma files attached yet.
            </span>
          ) : (
            figmaLinks.map((link, idx) => (
              <div
                key={link._id || `${link.url}-${idx}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  idx === safeIndex
                    ? "bg-[#1C1C1F] text-white border-[#1C1C1F]"
                    : "bg-[#F4F4F6] text-[#6E6E77] border-[#E2E2E2] hover:text-[#1C1C1F]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Figma className="w-3.5 h-3.5 text-[#EA5DEE]" />
                  <span>{link.title}</span>
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                      idx === safeIndex
                        ? "bg-white/15 text-white"
                        : "bg-[#FFFFFF] text-[#6E6E77]"
                    }`}
                  >
                    {link.kind}
                  </span>
                </button>
                {!readOnly && onSaveLinks && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleRemove(idx)}
                    className="ml-1 text-[#8A8A93] hover:text-rose-500 cursor-pointer"
                    title="Remove Figma link"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeLink && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="px-3.5 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1.5 cursor-pointer"
              >
                {expanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    Exit Full View
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand
                  </>
                )}
              </button>
              <a
                href={activeLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1.5"
              >
                Open in Figma
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          {!readOnly && onSaveLinks && (
            <Button onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="w-3.5 h-3.5" />
              Add Figma Link
            </Button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-2xl p-4 space-y-3 shadow-[0_2px_10px_rgba(28,28,31,0.03)]"
        >
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Dashboard UI, Mobile Proto)"
              className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F] placeholder-[#8A8A93]"
            />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.figma.com/design/... or /proto/..."
              className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F] placeholder-[#8A8A93]"
            />
            <div className="flex items-center gap-2">
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "design" | "prototype")
                }
                className="flex-1 px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F]"
              >
                <option value="design">Design Preview</option>
                <option value="prototype">Interactive Prototype</option>
              </select>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-[#6E6E77]">
            Paste any Figma share link (`Anyone with the link can view`). Use &ldquo;Open in Figma&rdquo; anytime you need to download assets or inspect typography.
          </p>
        </form>
      )}

      {/* Embed Frame */}
      {activeLink ? (
        <div
          className={
            expanded
              ? "fixed inset-4 z-50 bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-4 flex flex-col gap-3 shadow-2xl"
              : "bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-3 shadow-[0_2px_12px_rgba(28,28,31,0.03)]"
          }
        >
          {expanded && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C1C1F]">
                <Figma className="w-4 h-4 text-[#EA5DEE]" />
                <span>{activeLink.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1.5"
                >
                  Open in Figma
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="px-4 py-1.5 bg-[#1C1C1F] hover:bg-[#2C2C32] rounded-full text-xs font-semibold text-white cursor-pointer"
                >
                  Close Full View
                </button>
              </div>
            </div>
          )}
          <iframe
            title={activeLink.title}
            src={toFigmaEmbedUrl(activeLink.url)}
            allowFullScreen
            className={`w-full rounded-2xl border border-[#E2E2E2] bg-[#F4F4F6] ${
              expanded ? "flex-1 h-full" : "h-[560px]"
            }`}
          />
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-dashed border-[#D2D2DA] rounded-3xl p-12 text-center space-y-2">
          <Figma className="w-8 h-8 text-[#EA5DEE] mx-auto" />
          <p className="text-sm font-bold text-[#1C1C1F]">
            Preview Figma Designs &amp; Prototypes Here
          </p>
          <p className="text-xs text-[#6E6E77] max-w-md mx-auto">
            Add a Figma share link above to inspect design previews or click through interactive prototypes directly inside GiRe.
          </p>
        </div>
      )}
    </div>
  );
}
