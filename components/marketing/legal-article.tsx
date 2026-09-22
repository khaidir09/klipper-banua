import { Container } from "./section";

export type LegalSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

/**
 * Shared shell for the two legal pages, so both read the same way: one measure
 * of text (65ch), numbered headings in document order, no decoration.
 */
export function LegalArticle({
  title,
  updatedAt,
  intro,
  sections,
  footnote,
}: {
  title: string;
  /** Already formatted for display, e.g. "22 Sep 2026". */
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
  footnote?: string;
}) {
  return (
    <article className="py-12 lg:py-16">
      <Container>
        <div className="max-w-[65ch]">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Terakhir diperbarui {updatedAt}</p>

          {intro.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-base text-pretty text-muted-foreground">
              {paragraph}
            </p>
          ))}

          {sections.map((section, index) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-lg font-semibold tracking-tight">
                {index + 1}. {section.heading}
              </h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm text-pretty text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
                      <span className="text-pretty">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {footnote && <p className="mt-10 text-xs text-muted-foreground">{footnote}</p>}
        </div>
      </Container>
    </article>
  );
}
