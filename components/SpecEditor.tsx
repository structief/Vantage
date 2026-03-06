"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";

function getMarkdown(storage: unknown): string {
  return (storage as { markdown: MarkdownStorage }).markdown.getMarkdown();
}

interface Props {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  isSaving?: boolean;
}

export default function SpecEditor({ initialMarkdown, onChange, isSaving = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialMarkdown,
    immediatelyRender: false,
    onUpdate({ editor: e }) {
      onChange(getMarkdown(e.storage));
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-sm max-w-none outline-none min-h-[300px]",
          "prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:tracking-tight",
          "prose-h2:text-[16px] prose-h2:mt-8 prose-h2:mb-3",
          "prose-h3:text-[14px] prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-gray-800",
          "prose-h4:text-[13px] prose-h4:mt-4 prose-h4:mb-1.5 prose-h4:font-medium prose-h4:text-gray-700",
          "prose-p:text-[13px] prose-p:text-gray-600 prose-p:leading-relaxed",
          "prose-li:text-[13px] prose-li:text-gray-600",
          "prose-strong:text-gray-800 prose-strong:font-semibold",
          "prose-code:text-[12px] prose-code:text-gray-700 prose-code:bg-gray-50 prose-code:border prose-code:border-gray-100 prose-code:rounded prose-code:px-1 prose-code:py-px",
          "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-100 prose-pre:rounded-lg prose-pre:text-[12px]",
          "prose-blockquote:text-gray-500 prose-blockquote:border-l-gray-200 prose-blockquote:not-italic prose-blockquote:bg-gray-50/50 prose-blockquote:rounded-r prose-blockquote:py-1",
          "prose-hr:border-gray-100",
        ].join(" "),
      },
    },
  });


  return (
    <div className="relative">
      {isSaving && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-[13px] text-gray-600">Saving…</span>
          </div>
        </div>
      )}
      <div
        className={`border border-gray-200 rounded-lg px-6 py-5 bg-white focus-within:border-gray-300 transition-colors ${
          isSaving ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
