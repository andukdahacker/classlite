"use client";

import { Editor, EditorContent } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  Italic,
  Merge,
  Minus,
  Plus,
  Split,
  Table,
  Trash,
} from "lucide-react";
import { useState } from "react";

import { Separator } from "@workspace/ui/components/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";

import "./styles.css";

interface AppEditorProps {
  editor: Editor | null;
  showMenu?: boolean;
}

function AppEditor({
  className,
  editor,
  showMenu = true,
}: React.ComponentProps<"div"> & AppEditorProps) {
  if (!editor) return null;
  const [menuState, setMenuState] = useState<string[]>([]);
  const [textAlign, setTextAlign] = useState<string>("");
  const hasTableExtension = editor?.extensionManager.extensions.find(
    (ext) => ext.name === "table",
  );

  // NOTE: You may need to add the TextAlign extension to your editor instance.
  // e.g. TextAlign.configure({ types: ['heading', 'paragraph'] })
  const hasTextAlignExtension = editor?.extensionManager.extensions.find(
    (ext) => ext.name === "textAlign",
  );

  return (
    <div className={cn("border rounded-md p-2 gap-2 flex flex-col", className)}>
      {showMenu && (
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-1">
            <ToggleGroup
              type="multiple"
              variant={"outline"}
              value={menuState}
              onValueChange={setMenuState}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="bold"
                    aria-label="Toggle bold"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    <Bold className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bold</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="italic"
                    aria-label="Toggle italic"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Italic</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>

            {hasTextAlignExtension && (
              <>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <ToggleGroup
                  type="single"
                  variant={"outline"}
                  value={textAlign}
                  onValueChange={(value) => {
                    if (value) {
                      setTextAlign(value);
                      editor.chain().focus().setTextAlign(value).run();
                    } else {
                      setTextAlign("");
                      editor.chain().focus().unsetTextAlign().run();
                    }
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="left" aria-label="Align left">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align left</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="center" aria-label="Align center">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align center</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="right" aria-label="Align right">
                        <AlignRight className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align right</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="justify"
                        aria-label="Align justify"
                      >
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align justify</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </>
            )}

            {hasTableExtension && (
              <>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <ToggleGroup type="multiple" variant={"outline"}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="table"
                        aria-label="Insert table"
                        onClick={() =>
                          editor
                            .chain()
                            .focus()
                            .insertTable({
                              rows: 3,
                              cols: 3,
                              withHeaderRow: true,
                            })
                            .run()
                        }
                      >
                        <Table className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Insert table</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="addColumnBefore"
                        aria-label="Add column before"
                        onClick={() =>
                          editor.chain().focus().addColumnBefore().run()
                        }
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <Plus className="h-3 w-3 -ml-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add column before</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="addColumnAfter"
                        aria-label="Add column after"
                        onClick={() =>
                          editor.chain().focus().addColumnAfter().run()
                        }
                      >
                        <ArrowRight className="h-4 w-4" />
                        <Plus className="h-3 w-3 -ml-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add column after</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="deleteColumn"
                        aria-label="Delete column"
                        onClick={() =>
                          editor.chain().focus().deleteColumn().run()
                        }
                      >
                        <ArrowRight className="h-4 w-4" />
                        <Minus className="h-3 w-3 -ml-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete column</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="addRowBefore"
                        aria-label="Add row before"
                        onClick={() =>
                          editor.chain().focus().addRowBefore().run()
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                        <Plus className="h-3 w-3 -mt-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add row before</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="addRowAfter"
                        aria-label="Add row after"
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <Plus className="h-3 w-3 -mt-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add row after</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="deleteRow"
                        aria-label="Delete row"
                        onClick={() => editor.chain().focus().deleteRow().run()}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <Minus className="h-3 w-3 -mt-1" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete row</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="deleteTable"
                        aria-label="Delete table"
                        onClick={() =>
                          editor.chain().focus().deleteTable().run()
                        }
                      >
                        <Trash className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete table</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="mergeOrSplit"
                        aria-label="Merge or split cells"
                        onClick={() =>
                          editor.chain().focus().mergeOrSplit().run()
                        }
                      >
                        <Merge className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Merge or split cells</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="toggleHeaderColumn"
                        aria-label="Toggle header column"
                        onClick={() =>
                          editor.chain().focus().toggleHeaderColumn().run()
                        }
                      >
                        <Split className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle header column</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </>
            )}
          </div>
        </TooltipProvider>
      )}

      <EditorContent editor={editor} className="p-0.5" />
    </div>
  );
}

export { AppEditor };