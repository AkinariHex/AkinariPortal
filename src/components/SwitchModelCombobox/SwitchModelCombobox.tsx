"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SWITCH_MODELS, type SwitchTech } from "@/lib/keyboardSettings";

type Props = {
  value: string;
  onChange: (model: string) => void;
  tech: SwitchTech;
  placeholder?: string;
  size?: "default" | "sm";
  className?: string;
};

// Suggests the known switches for the chosen technology, but the list is not a
// closed set: typing a model that is not in it and pressing Enter saves that
// text (the custom entry sits last, so it is the highlighted one exactly when
// nothing else matches).
export default function SwitchModelCombobox({
  value,
  onChange,
  tech,
  placeholder = "Select or type a switch",
  size = "default",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = SWITCH_MODELS[tech] ?? [];
  const typed = query.trim();
  const exists = options.some((o) => o.toLowerCase() === typed.toLowerCase());

  const commit = (model: string) => {
    onChange(model);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size}
          className={cn("w-full min-w-0 justify-between font-normal", className)}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-[15rem] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search or type a model..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-64">
            {options.length > 0 && (
              <CommandGroup heading="Known switches">
                {options.map((model) => (
                  <CommandItem
                    key={model}
                    value={model}
                    onSelect={() => commit(model)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === model ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {typed && !exists && (
              <CommandGroup heading="Custom">
                <CommandItem
                  value={`custom ${typed}`}
                  onSelect={() => commit(typed)}
                >
                  <Plus className="mr-2 size-4" />
                  Use &quot;{typed}&quot;
                </CommandItem>
              </CommandGroup>
            )}

            {!typed && value && (
              <CommandGroup>
                <CommandItem value="__clear" onSelect={() => commit("")}>
                  <X className="mr-2 size-4" />
                  Clear
                </CommandItem>
              </CommandGroup>
            )}

            <CommandEmpty>Type a model and press Enter.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
