import { Card, CardContent } from "@/components/ui/card";

export default function DarkCard({ children, className = "" }) {
  return (
    <div
      className={`master-card rounded-[28px] p-4 shadow-xl shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
}