import { Input } from "@/components/ui/input";

export default function InputDark(props) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 ${props.className || ""}`}
    />
  );
}