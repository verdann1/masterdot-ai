import { Textarea } from "@/components/ui/textarea";

export default function TextareaDark(props) {
  return (
    <Textarea
      {...props}
      className={`rounded-2xl border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 ${props.className || ""}`}
    />
  );
}