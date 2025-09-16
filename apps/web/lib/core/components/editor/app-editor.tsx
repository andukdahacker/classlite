"use client";

import { Editor, EditorContent } from "@tiptap/react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { Bold, Italic } from "lucide-react";
import { useState } from "react";

interface AppEditorProps {
  editor: Editor | null;
  showMenu?: boolean;
}

function AppEditor({
  className,
  editor,
  showMenu = true,
}: React.ComponentProps<"div"> & AppEditorProps) {
  const [menuState, setMenuState] = useState<string[]>([]);
  return (
    <div className={cn("border rounded-md p-2 gap-2 flex flex-col", className)}>
      {showMenu && (
        <ToggleGroup
          type="multiple"
          variant={"outline"}
          value={menuState}
          onValueChange={setMenuState}
        >
          <ToggleGroupItem
            value="bold"
            aria-label="Toggle bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Toggle italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      <EditorContent editor={editor} className="p-0.5" />
    </div>
  );
}

export { AppEditor };
