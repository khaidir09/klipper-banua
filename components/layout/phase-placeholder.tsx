import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Stand-in for a tab whose module is built in a later PRD phase. */
export function PhasePlaceholder({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {children} Tersedia pada {phase}.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
