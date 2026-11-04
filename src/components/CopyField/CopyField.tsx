"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied.");
  } catch {
    toast.error("Could not copy.");
  }
}

// Read-only value with a copy button.
export default function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        <Input readOnly value={value} className="flex-1 font-mono text-xs" />
        <Button type="button" size="icon" variant="outline" onClick={() => copy(value)} aria-label={`Copy ${label}`}>
          <Copy />
        </Button>
      </div>
    </div>
  );
}
