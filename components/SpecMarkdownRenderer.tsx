"use client";

import ReactMarkdown from "react-markdown";
import { stripFrontmatter } from "@/lib/spec-utils";

interface Props {
  markdown: string;
}

export default function SpecMarkdownRenderer({ markdown }: Props) {
  const body = stripFrontmatter(markdown);
  return (
    <div className="prose prose-sm max-w-none
      prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:tracking-tight
      prose-h2:text-[16px] prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-[14px] prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-gray-800
      prose-h4:text-[13px] prose-h4:mt-4 prose-h4:mb-1.5 prose-h4:font-medium prose-h4:text-gray-700
      prose-p:text-[13px] prose-p:text-gray-600 prose-p:leading-relaxed
      prose-li:text-[13px] prose-li:text-gray-600
      prose-strong:text-gray-800 prose-strong:font-semibold
      prose-code:text-[12px] prose-code:text-gray-700 prose-code:bg-gray-50 prose-code:border prose-code:border-gray-100 prose-code:rounded prose-code:px-1 prose-code:py-px
      prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-100 prose-pre:rounded-lg prose-pre:text-[12px]
      prose-blockquote:text-gray-500 prose-blockquote:border-l-gray-200 prose-blockquote:not-italic prose-blockquote:bg-gray-50/50 prose-blockquote:rounded-r prose-blockquote:py-1
      prose-hr:border-gray-100
    ">
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
