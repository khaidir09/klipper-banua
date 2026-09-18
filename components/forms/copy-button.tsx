"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  value: string;
  label: string;
  /** Message shown after copying, e.g. "Tautan disalin". */
  successMessage?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  iconOnly?: boolean;
};

export function CopyButton({
  value,
  label,
  successMessage = "Disalin ke papan klip.",
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin. Salin secara manual.");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <Button
      type="button"
      size={iconOnly ? "icon-sm" : size}
      variant={variant}
      onClick={copy}
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden />
      {iconOnly ? null : label}
    </Button>
  );
}
