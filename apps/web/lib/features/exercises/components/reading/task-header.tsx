"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronDown, ChevronUp, Copy, GripVertical, X } from "lucide-react";

interface TaskHeaderProps {
  title: string;
  isExpanded: boolean;
  onExpand: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragHandleProps: any;
}

export function TaskHeader({
  title,
  isExpanded,
  onExpand,
  onDuplicate,
  onRemove,
  dragHandleProps,
}: TaskHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div {...dragHandleProps} className="cursor-grab">
          <GripVertical />
        </div>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={onExpand}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}