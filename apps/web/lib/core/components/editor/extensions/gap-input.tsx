'use client';

import { Input } from "@workspace/ui/components/input";
import { NodeViewWrapper } from "@tiptap/react";

export function GapInput(props: any) {
    return (
        <NodeViewWrapper as="span" className="inline-block w-32 mx-1">
            <Input placeholder={`[${props.node.attrs.order}]`} />
        </NodeViewWrapper>
    );
}
