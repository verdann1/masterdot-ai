import { Card, CardContent } from "@/components/ui/card";

export default function DarkCard({ children }) {
  return (
    <Card className="rounded-3xl border border-slate-800 bg-slate-900 shadow-sm">
      <CardContent className="space-y-3 p-4">{children}</CardContent>
    </Card>
  );
}