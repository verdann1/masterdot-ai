import { motion } from "framer-motion";

export default function Metric({ icon, title, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="master-card rounded-[28px] p-4 shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
          {icon}
        </div>

        <span className="text-2xl font-bold text-white">{value}</span>
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
    </motion.div>
  );
}