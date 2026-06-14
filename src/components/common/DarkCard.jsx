export default function DarkCard({ children, className = "", highlight = false }) {
  return (
    <div className={`${highlight ? "mp-card-highlight" : "mp-card"} rounded-[28px] p-4 shadow-xl shadow-black/30 ${className}`}>
      {children}
    </div>
  );
}
