import { ChevronDown } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Native `details`/`summary`: keyboard operable and readable with the browser's
 * find-in-page without a line of JavaScript.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        <details key={item.question} className="group px-4 py-4 sm:px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-base font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="mt-3 max-w-[65ch] text-sm text-pretty text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
