export default function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}