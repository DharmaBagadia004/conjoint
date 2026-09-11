import MetricCard from "./MetricCard";

function ComparisonSummary({
  personas,
  className = ""
}) {
  const summaryCards = [
    {
      title: "Compared Personas",
      value: `${personas.length}`,
      detail: personas.map((persona) => persona.name).join(", ")
    }
  ];

  return (
    <section className={`flex h-full min-h-0 flex-col space-y-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Persona Comparison
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Alignment, spread, and disagreement signals
          </p>
        </div>

      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            detail={card.detail}
          />
        ))}
      </div>
    </section>
  );
}

export default ComparisonSummary;
