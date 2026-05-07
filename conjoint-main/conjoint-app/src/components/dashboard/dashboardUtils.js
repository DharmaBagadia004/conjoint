const personaPalette = [
  {
    fill: "#2563eb",
    stroke: "#1d4ed8",
    soft: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    fill: "#f97316",
    stroke: "#ea580c",
    soft: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    fill: "#10b981",
    stroke: "#059669",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    fill: "#8b5cf6",
    stroke: "#7c3aed",
    soft: "bg-violet-50 text-violet-700 border-violet-200"
  }
];

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function getPersonaColorMap(personas) {
  return personas.reduce((accumulator, persona, index) => {
    accumulator[persona.id] = personaPalette[index % personaPalette.length];
    return accumulator;
  }, {});
}

export function getUtilityTone(value) {
  if (value > 0) {
    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: "text-emerald-600",
      bar: "#10b981"
    };
  }

  if (value < 0) {
    return {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      text: "text-rose-600",
      bar: "#ef4444"
    };
  }

  return {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    text: "text-slate-500",
    bar: "#94a3b8"
  };
}

export function buildCsvContent(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const safe = `${cell ?? ""}`.replace(/"/g, "\"\"");
          return `"${safe}"`;
        })
        .join(",")
    )
    .join("\n");
}

export function downloadCsv(filename, rows) {
  const csvContent = buildCsvContent(rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getAttributeById(persona, attributeId) {
  return persona.attributes.find((attribute) => attribute.id === attributeId);
}

function getLevelById(attribute, levelId) {
  return attribute?.levels.find((level) => level.id === levelId);
}

export function buildComparisonModel(personas) {
  if (!personas.length) {
    return [];
  }

  return personas[0].attributes.map((attribute) => {
    const personaImportances = personas.map((persona) => {
      const matchedAttribute = getAttributeById(persona, attribute.id);
      return {
        personaId: persona.id,
        personaName: persona.name,
        importance: matchedAttribute?.importance ?? 0
      };
    });

    const levels = attribute.levels.map((level) => {
      const utilities = personas.map((persona) => {
        const matchedAttribute = getAttributeById(persona, attribute.id);
        const matchedLevel = getLevelById(matchedAttribute, level.id);
        return {
          personaId: persona.id,
          personaName: persona.name,
          utility: matchedLevel?.utility ?? 0
        };
      });

      const utilityValues = utilities.map((item) => item.utility);
      const highestUtility = Math.max(...utilityValues);
      const lowestUtility = Math.min(...utilityValues);

      return {
        id: level.id,
        name: level.name,
        utilities,
        spread: highestUtility - lowestUtility,
        highestUtility,
        lowestUtility
      };
    });

    return {
      id: attribute.id,
      name: attribute.name,
      personaImportances,
      maxImportance: Math.max(...personaImportances.map((item) => item.importance)),
      levels,
      largestSpread: Math.max(...levels.map((level) => level.spread))
    };
  });
}

export function buildComparisonInsights(personas) {
  const model = buildComparisonModel(personas);
  if (!model.length) {
    return {
      summaryCards: [],
      insights: []
    };
  }

  const highestImportanceByAttribute = model.map((attribute) => {
    const winner = attribute.personaImportances.reduce((best, current) =>
      current.importance > best.importance ? current : best
    );

    return {
      title: `Most ${attribute.name.toLowerCase()}-focused`,
      value: winner.personaName,
      detail: `${attribute.name} importance: ${formatPercent(winner.importance)}`
    };
  });

  const priceAttribute = model.find((attribute) => attribute.id === "price");
  const priceCard = priceAttribute
    ? (() => {
        const winner = priceAttribute.personaImportances.reduce((best, current) =>
          current.importance > best.importance ? current : best
        );

        return {
          title: "Most price-sensitive",
          value: winner.personaName,
          detail: `${formatPercent(winner.importance)} importance on Price`
        };
      })()
    : null;

  const allLevels = model.flatMap((attribute) =>
    attribute.levels.map((level) => ({
      attributeName: attribute.name,
      levelName: level.name,
      spread: level.spread
    }))
  );

  const largestDisagreement = allLevels.reduce((best, current) =>
    current.spread > best.spread ? current : best
  );

  const mostAlignedAttribute = model.reduce((best, current) => {
    const averageSpread =
      current.levels.reduce((sum, level) => sum + level.spread, 0) /
      Math.max(1, current.levels.length);

    if (!best || averageSpread < best.averageSpread) {
      return {
        attributeName: current.name,
        averageSpread
      };
    }

    return best;
  }, null);

  const summaryCards = [
    ...(priceCard ? [priceCard] : []),
    {
      title: "Largest disagreement",
      value: `${largestDisagreement.attributeName} → ${largestDisagreement.levelName}`,
      detail: `Utility spread: ${largestDisagreement.spread.toFixed(0)} points`
    },
    {
      title: "Most aligned attribute",
      value: mostAlignedAttribute.attributeName,
      detail: `Average utility spread: ${mostAlignedAttribute.averageSpread.toFixed(1)}`
    },
    ...highestImportanceByAttribute.slice(0, 2)
  ].slice(0, 4);

  const insights = highestImportanceByAttribute.map((item) => ({
    id: item.title,
    text: `Among the compared personas, ${item.value} gives the highest weight to ${item.title.replace("Most ", "").replace("-focused", "")}.`
  }));

  insights.push({
    id: "largest-disagreement",
    text: `The largest utility disagreement appears in ${largestDisagreement.attributeName} -> ${largestDisagreement.levelName}.`
  });

  if (personas.length >= 2) {
    const pairComparisons = [];

    for (let index = 0; index < personas.length; index += 1) {
      for (let innerIndex = index + 1; innerIndex < personas.length; innerIndex += 1) {
        const firstPersona = personas[index];
        const secondPersona = personas[innerIndex];
        let distance = 0;

        model.forEach((attribute) => {
          const firstImportance = attribute.personaImportances.find(
            (item) => item.personaId === firstPersona.id
          )?.importance ?? 0;
          const secondImportance = attribute.personaImportances.find(
            (item) => item.personaId === secondPersona.id
          )?.importance ?? 0;
          distance += Math.abs(firstImportance - secondImportance);
        });

        pairComparisons.push({
          pair: `${firstPersona.name} and ${secondPersona.name}`,
          distance
        });
      }
    }

    pairComparisons.sort((left, right) => left.distance - right.distance);
    if (pairComparisons[0]) {
      insights.push({
        id: "closest-personas",
        text: `${pairComparisons[0].pair} have the most similar attribute-importance profile in this dataset.`
      });
    }
  }

  return {
    summaryCards,
    insights
  };
}
