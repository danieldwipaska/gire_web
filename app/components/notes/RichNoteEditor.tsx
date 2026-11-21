"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TableKit } from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  CheckSquare,
  Code,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from "lucide-react";

const lowlight = createLowlight(common);

const CODE_LANGUAGES = [
  { label: "Auto / Plaintext", value: "" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Bash / Shell", value: "bash" },
  { label: "JSON", value: "json" },
  { label: "SQL", value: "sql" },
  { label: "CSS", value: "css" },
  { label: "HTML / XML", value: "xml" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
];

interface Props {
  noteId: string;
  initialContent: string;
  onChange: (html: string) => void;
  onDelegateSelection?: (selectedText: string) => void;
}

export default function RichNoteEditor({
  noteId,
  initialContent,
  onChange,
  onDelegateSelection,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [activeCodeLang, setActiveCodeLang] = useState("");
  const [isInCodeBlock, setIsInCodeBlock] = useState(false);
  const [isInTable, setIsInTable] = useState(false);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Image upload failed");
      }
      return data.url as string;
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Image upload failed",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TableKit,
      Placeholder.configure({
        placeholder:
          "Write notes, specs, paste screenshots (Ctrl+V), or type ``` for code blocks...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      const text =
        from !== to ? ed.state.doc.textBetween(from, to, " ").trim() : "";
      setSelectedText(text);
      const inCode = ed.isActive("codeBlock");
      setIsInCodeBlock(inCode);
      if (inCode) {
        setActiveCodeLang(
          (ed.getAttributes("codeBlock").language as string) || "",
        );
      }
      setIsInTable(ed.isActive("table"));
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            void uploadImageFile(file).then((url) => {
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find((f) =>
          f.type.startsWith("image/"),
        );
        if (!imageFile) return false;
        event.preventDefault();
        void uploadImageFile(imageFile).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
    },
  });

  // Reset editor content when switching to a different note
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor]);

  if (!editor) {
    return (
      <div className="min-h-[380px] bg-[#0b0f19] border border-slate-800 rounded-xl p-4 text-xs text-slate-500">
        Loading editor...
      </div>
    );
  }

  const ToolbarBtn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  return (
    <div className="flex flex-col border border-slate-800 rounded-xl bg-[#0b0f19] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-800 bg-[#131924]">
        <ToolbarBtn
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <ToolbarBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline Code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <ToolbarBtn
          title="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code Block"
          active={isInCodeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <FileCode2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Insert Table"
          active={isInTable}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Link"
          active={editor.isActive("link")}
          onClick={handleSetLink}
        >
          <Link2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Upload Image"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="w-4 h-4" />
        </ToolbarBtn>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const url = await uploadImageFile(file);
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        />

        {isInCodeBlock && (
          <select
            value={activeCodeLang}
            onChange={(e) => {
              const lang = e.target.value;
              setActiveCodeLang(lang);
              editor
                .chain()
                .focus()
                .updateAttributes("codeBlock", { language: lang })
                .run();
            }}
            className="ml-2 px-2 py-1 bg-[#0b0f19] border border-slate-700 rounded text-[11px] text-slate-200"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}

        {isInTable && (
          <div className="flex items-center gap-1 ml-2 text-[11px]">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
            >
              +Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
            >
              +Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 rounded text-rose-300 cursor-pointer"
            >
              Del Table
            </button>
          </div>
        )}

        {onDelegateSelection && (
          <button
            type="button"
            onClick={() => onDelegateSelection(selectedText)}
            className="ml-auto px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 cursor-pointer"
            title="Turn highlighted text (or create a new task) and delegate to a GiRe user"
          >
            <ListTodo className="w-3.5 h-3.5" />
            {selectedText ? "Delegate Selection as Task" : "Delegate Task"}
          </button>
        )}
      </div>

      {(uploading || uploadError) && (
        <div className="px-4 py-1.5 border-b border-slate-800 text-xs bg-[#131924]">
          {uploading ? (
            <span className="text-indigo-300">Uploading image to VPS...</span>
          ) : (
            <span className="text-rose-400">{uploadError}</span>
          )}
        </div>
      )}

      {/* Editor Content */}
      <div className="p-5 min-h-[420px] max-h-[65vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

