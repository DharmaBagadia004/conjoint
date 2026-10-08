import { useState } from "react";
import { getPersonaColorMap } from "./dashboardUtils";
import { consolidatePreferences, rankAttributes, rankDistribution } from "./rankingUtils";
import UtilityExportButton from "./UtilityExportButton";

const percent = (value) => `${(value * 100).toFixed(1)}%`;
const rankColors = ["#047857", "#0284c7", "#7c3aed", "#d97706", "#e11d48", "#475569"];

function LevelExtremes({ levels, scoreKey = "utility" }) {
  if (!levels.length) return <p className="text-xs text-slate-500">No levels available</p>;
  const best = levels[0][scoreKey];
  const worst = levels[levels.length - 1][scoreKey];
  if (Math.abs(best - worst) < 1e-10) return <p className="text-xs text-slate-500">All levels equally preferred</p>;
  return (
    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
      <div className="rounded-lg bg-emerald-50 p-3 text-emerald-900"><span className="block font-medium text-emerald-700">Most preferred</span>{levels.filter((l) => Math.abs(l[scoreKey] - best) < 1e-10).map((l) => l.name).join(" / ")}</div>
      <div className="rounded-lg bg-rose-50 p-3 text-rose-900"><span className="block font-medium text-rose-700">Least preferred</span>{levels.filter((l) => Math.abs(l[scoreKey] - worst) < 1e-10).map((l) => l.name).join(" / ")}</div>
    </div>
  );
}

function ImportanceCard({ attribute, color = "#059669", consolidated = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">#{attribute.rank}</span>
        <h3 className="flex-1 text-sm font-semibold text-slate-800">{attribute.name}</h3>
        <span className="text-sm font-semibold tabular-nums text-slate-800">{percent(attribute.importance)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: percent(attribute.importance), background: color }} /></div>
      <LevelExtremes levels={attribute.rankedLevels} scoreKey={consolidated ? "score" : "utility"} />
    </div>
  );
}

function PersonaHighlights({ personas }) {
  const persona = personas[0];
  if (!persona) return null;
  const attributes = rankAttributes(persona);
  const top = attributes.filter((a) => a.rank <= 3);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-slate-900">What matters to {persona.name}?</h2><p className="mt-1 text-sm text-slate-500">Top three attribute ranks, with the most and least preferred levels. Ties are included.</p></div>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">{top.map((a) => <ImportanceCard key={a.id} attribute={a} />)}</div>
      <div className="rounded-xl bg-slate-50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Full attribute ranking</h3>
        <div className="space-y-4">{attributes.map((a) => (
          <div key={a.id} className="grid grid-cols-[minmax(100px,1fr)_2fr_55px] items-center gap-3 text-sm">
            <span className="text-slate-600">#{a.rank} {a.name}</span>
            <div className="h-5 rounded bg-slate-200"><div className="h-full rounded bg-emerald-600" style={{ width: `${attributes[0].importance ? a.importance / attributes[0].importance * 100 : 0}%` }} /></div>
            <span className="text-right tabular-nums text-slate-700">{percent(a.importance)}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function ProductView({ personas }) {
  const attributes = consolidatePreferences(personas);
  const bottom = rankItemsAscending(attributes);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-slate-900">Product priorities</h2><p className="mt-1 text-sm text-slate-500">Consolidated across {personas.length} selected {personas.length === 1 ? "persona" : "personas"}, each weighted equally.</p></div>
        <UtilityExportButton label="Export priorities" filename="product-priorities.csv" rows={[["Attribute", "Importance rank", "Mean importance", "Level", "Relative preference (0-100)"], ...attributes.flatMap((a) => a.rankedLevels.map((l) => [a.name, a.rank, a.importance, l.name, l.score]))]} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3"><h3 className="text-sm font-semibold text-emerald-800">Top 3 attribute ranks</h3>{attributes.filter((a) => a.rank <= 3).map((a) => <ImportanceCard key={a.id} attribute={a} consolidated />)}</div>
        <div className="space-y-3"><h3 className="text-sm font-semibold text-slate-600">Bottom 3 attribute ranks</h3>{bottom.filter((a) => a.bottomRank <= 3).map((a) => <ImportanceCard key={a.id} attribute={a} consolidated color="#64748b" />)}</div>
      </div>
      <p className="text-xs leading-5 text-slate-500">Attributes are ranked by mean importance; lower importance does not mean disliked. Level preferences are scaled from 0 (least) to 100 (most) within each attribute and persona, then averaged. A flat preference receives 50. These scores are not purchase probabilities. Ties are included; top and bottom groups can overlap in small studies.</p>
    </div>
  );
}

function rankItemsAscending(attributes) {
  const sorted = [...attributes].sort((a, b) => a.importance - b.importance || a.name.localeCompare(b.name));
  return sorted.map((a) => ({ ...a, bottomRank: sorted.findIndex((b) => Math.abs(a.importance - b.importance) < 1e-10) + 1 }));
}

function ParallelCoordinates({ personas }) {
  const [highlightedId, setHighlightedId] = useState("");
  const colors = getPersonaColorMap(personas);
  const attributes = consolidatePreferences(personas);
  const width = Math.max(620, attributes.length * 150);
  const height = 350;
  const x = (index) => attributes.length === 1 ? width / 2 : 70 + index * (width - 140) / (attributes.length - 1);
  const y = (importance) => 280 - importance * 240;
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold text-slate-900">Parallel coordinates</h2><p className="mt-1 text-sm text-slate-500">Follow each persona across attribute axes. Every axis uses the same 0–100% importance scale.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Highlight a persona">
        {personas.map((p) => <button key={p.id} type="button" aria-pressed={highlightedId === p.id} onClick={() => setHighlightedId(highlightedId === p.id ? "" : p.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${highlightedId === p.id ? "border-slate-600 bg-slate-100" : "border-slate-200"}`}><span className="h-2 w-2 rounded-full" style={{ background: colors[p.id].stroke }} />{p.name}</button>)}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} className="h-[350px] w-full" role="img" aria-label="Parallel coordinate chart of attribute importance by persona">
          {attributes.map((a, index) => <g key={a.id}>
            <line x1={x(index)} x2={x(index)} y1="40" y2="280" stroke="#cbd5e1" />
            {[0, 0.25, 0.5, 0.75, 1].map((value) => <g key={value}><line x1={x(index) - 4} x2={x(index) + 4} y1={y(value)} y2={y(value)} stroke="#94a3b8" /><text x={x(index) - 8} y={y(value) + 4} textAnchor="end" fontSize="10" fill="#64748b">{value * 100}%</text></g>)}
            <text x={x(index)} y="310" textAnchor="middle" fontSize="12" fill="#334155">{a.name}</text>
          </g>)}
          {personas.map((p, index) => {
            const points = attributes.map((a, i) => { const entry = p.attributes.find((item) => item.id === a.id); return entry ? { x: x(i), y: y(entry.importance), attribute: entry } : null; });
            return <g key={p.id} opacity={highlightedId && highlightedId !== p.id ? 0.15 : 1}>
              <path d={points.map((point, i) => point ? `${i === 0 || !points[i - 1] ? "M" : "L"}${point.x},${point.y}` : "").join(" ")} fill="none" stroke={colors[p.id].stroke} strokeWidth="3" strokeDasharray={index ? `${10 - index * 2} 3` : undefined} />
              {points.filter(Boolean).map((point) => <circle key={point.attribute.id} cx={point.x} cy={point.y} r="5" fill={colors[p.id].stroke} stroke="white" strokeWidth="2"><title>{p.name}: {point.attribute.name} {percent(point.attribute.importance)}</title></circle>)}
            </g>;
          })}
        </svg>
      </div>
      <details className="text-sm text-slate-600"><summary className="cursor-pointer font-medium">View exact values</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Attribute importance by persona</caption><thead><tr><th className="p-2">Attribute</th>{personas.map((p) => <th key={p.id} className="p-2">{p.name}</th>)}</tr></thead><tbody>{attributes.map((a) => <tr key={a.id}><th className="p-2">{a.name}</th>{personas.map((p) => { const entry = p.attributes.find((item) => item.id === a.id); return <td key={p.id} className="p-2">{entry ? percent(entry.importance) : "Not available"}</td>; })}</tr>)}</tbody></table></div></details>
    </div>
  );
}

function RankDistribution({ personas }) {
  const rows = rankDistribution(personas);
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold text-slate-900">Which attribute ranks first?</h2><p className="mt-1 text-sm text-slate-500">How often each attribute takes each rank across {personas.length} selected {personas.length === 1 ? "persona" : "personas"}.</p></div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">{rows[0]?.counts.map((_, i) => <span key={i} className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: rankColors[i % rankColors.length] }} />Rank {i + 1}</span>)}</div>
      <div className="space-y-5">{rows.map((row) => <div key={row.id}>
        <div className="mb-2 flex justify-between gap-2 text-sm"><span className="font-medium text-slate-800">{row.name}</span><span className="text-xs text-slate-500">Mean rank {row.meanRank.toFixed(1)}</span></div>
        <div className="flex h-10 overflow-hidden rounded-lg bg-slate-100" role="img" aria-label={`${row.name}: ${row.personaRanks.map((entry) => `${entry.personaName}: rank ${entry.rank}`).join(", ")}`}>
          {row.counts.map((count, i) => count ? <div key={i} style={{ width: `${count / row.total * 100}%`, background: rankColors[i % rankColors.length] }} className="flex items-center justify-center text-xs font-semibold text-white" title={`Rank ${i + 1}: ${count} of ${row.total} personas. ${row.personaRanks.filter((entry) => entry.rank === i + 1).map((entry) => entry.personaName).join(", ")}`}>#{i + 1} · {count}</div> : null)}
        </div>
      </div>)}</div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <caption className="bg-slate-50 p-4 text-left">
            <span className="block font-semibold text-slate-800">Rank by persona</span>
            <span className="mt-1 block text-xs text-slate-500">Each cell shows the attribute's rank and importance for that persona.</span>
          </caption>
          <thead className="border-y border-slate-200 bg-slate-50 text-slate-700">
            <tr><th scope="col" className="px-4 py-3">Attribute</th>{personas.map((persona) => <th key={persona.id} scope="col" className="min-w-[130px] px-4 py-3">{persona.name}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                <th scope="row" className="px-4 py-3 font-medium text-slate-800">{row.name}</th>
                {personas.map((persona) => {
                  const entry = row.personaRanks.find((item) => item.personaId === persona.id);
                  return <td key={persona.id} className="px-4 py-3">{entry ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded px-2 py-1 text-xs font-semibold text-white" style={{ background: rankColors[(entry.rank - 1) % rankColors.length] }}>#{entry.rank}</span>
                      <span className="text-xs tabular-nums text-slate-500">{percent(entry.importance)}</span>
                    </div>
                  ) : <span className="text-xs text-slate-500">Not available</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <p className="font-semibold text-slate-800">How to read this chart</p>
        <p className="mt-1">Each row is an attribute. Colors represent ranks, and segment widths show the share of selected personas assigning that rank. A label such as #1 &middot; 2 means two personas rank the attribute first.</p>
        <p className="mt-2">Hover over a segment to see the persona names, or use the table above to see every persona's exact rank.</p>
        <p className="mt-2">Mean rank averages the ranks across personas; lower means more important. Rows are sorted from lowest to highest mean rank. Each persona has equal weight.</p>
        <p className="mt-2">Ranks come from attribute importance, not observed respondent rankings. Tied attributes share a rank and skip the next position (1, 1, 3).</p>
      </div>
    </div>
  );
}

export default function PreferenceInsights({ view, personas }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {view === "highlights" && <PersonaHighlights personas={personas} />}
      {view === "product" && <ProductView personas={personas} />}
      {view === "parallel" && <ParallelCoordinates personas={personas} />}
      {view === "ranks" && <RankDistribution personas={personas} />}
    </section>
  );
}
