"use client";

import { useState } from "react";
import type { TaxonomyNode } from "@/lib/taxonomy";

function NodeButton({
  node,
  selected,
  onSelect,
}: {
  node: TaxonomyNode;
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const active = selected === node.code;
  return (
    <button
      onClick={() => onSelect(node.code)}
      className={`block rounded-full px-3 py-1 text-left text-sm transition-colors ${
        active ? "bg-primary font-medium text-on-primary" : "text-body hover:bg-surface-soft"
      }`}
    >
      {node.name}
    </button>
  );
}

function Branch({
  node,
  selected,
  onSelect,
  depth,
}: {
  node: TaxonomyNode;
  selected: string | null;
  onSelect: (code: string) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "접기" : "펼치기"}
            className="w-5 shrink-0 text-xs text-mute"
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <NodeButton node={node} selected={selected} onSelect={onSelect} />
      </div>
      {hasChildren && open && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-hairline pl-3">
          {node.children.map((child) => (
            <Branch key={child.code} node={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TaxonomyTree({
  tree,
  selected,
  onSelect,
}: {
  tree: TaxonomyNode[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {tree.map((group) => (
        <li key={group.code}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">{group.name}</p>
          <ul className="space-y-1">
            {group.children.map((node) => (
              <Branch key={node.code} node={node} selected={selected} onSelect={onSelect} depth={0} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
