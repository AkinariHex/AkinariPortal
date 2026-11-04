"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Paste rows from a spreadsheet (Sheets/Excel copy = tab separated) or CSV.
// `onImport` returns true to clear the box.
export default function SheetImport({
  placeholder,
  label = "Import",
  pending,
  onImport,
  children,
}: {
  placeholder: string;
  label?: string;
  pending: boolean;
  onImport: (text: string) => Promise<boolean>;
  children?: React.ReactNode;
}) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={6} className="font-mono text-xs" />
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button
          type="button"
          disabled={pending || !text.trim()}
          onClick={async () => {
            if (await onImport(text)) setText("");
          }}
        >
          <Upload /> {pending ? "Importing..." : label}
        </Button>
      </div>
    </div>
  );
}
