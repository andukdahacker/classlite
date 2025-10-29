'use client';

import { Input } from '@workspace/ui/components/input';
import { NodeViewWrapper } from '@tiptap/react';

interface GapInputSubmissionProps {
  order: number;
  value: string;
  onChange: (order: number, value: string) => void;
  isSubmitted: boolean;
}

export function GapInputSubmission({ order, value, onChange, isSubmitted }: GapInputSubmissionProps) {
  return (
    <NodeViewWrapper as="span" className="inline-block w-32 mx-1">
      <Input
        placeholder={`[${order}]`}
        value={value}
        onChange={(e) => onChange(order, e.target.value)}
        disabled={isSubmitted}
      />
    </NodeViewWrapper>
  );
}
