"use client";

import { AppEditor } from "@/lib/core/components/editor/app-editor";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Content, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface ReadingMaterialViewerProps {
  title: string;
  content: Content;
}

export function ReadingMaterialViewer({
  title,
  content,
}: ReadingMaterialViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <AppEditor editor={editor} showMenu={false} />
    </div>
  );
}
