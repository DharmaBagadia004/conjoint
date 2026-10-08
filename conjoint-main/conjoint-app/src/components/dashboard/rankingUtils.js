// Competition ranks: tied scores receive the same rank (1, 1, 3).
export function rankItems(items, scoreKey) {
  const sorted = [...items].sort((a, b) => b[scoreKey] - a[scoreKey] || a.name.localeCompare(b.name));
  return sorted.map((item, index) => ({
    ...item,
    rank: sorted.findIndex((other) => Math.abs(other[scoreKey] - item[scoreKey]) < 1e-10) + 1,
    position: index + 1,
  }));
}

export function rankAttributes(persona) {
  return rankItems(persona.attributes, "importance").map((attribute) => ({
    ...attribute,
    rankedLevels: rankItems(attribute.levels, "utility"),
  }));
}

export function consolidatePreferences(personas) {
  const attributeIds = [...new Set(personas.flatMap((persona) => persona.attributes.map((a) => a.id)))];
  const attributes = attributeIds.map((id) => {
    const entries = personas.flatMap((persona) => persona.attributes.filter((a) => a.id === id));
    const levelIds = [...new Set(entries.flatMap((a) => a.levels.map((level) => level.id)))];
    const levels = levelIds.map((levelId) => {
      const scores = entries.flatMap((attribute) => {
        const level = attribute.levels.find((item) => item.id === levelId);
        if (!level) return [];
        const min = Math.min(...attribute.levels.map((item) => item.utility));
        const max = Math.max(...attribute.levels.map((item) => item.utility));
        return [{ name: level.name, score: max === min ? 50 : (level.utility - min) / (max - min) * 100 }];
      });
      return { id: levelId, name: scores[0].name, score: scores.reduce((sum, item) => sum + item.score, 0) / scores.length };
    });
    return {
      id, name: entries[0].name,
      importance: entries.reduce((sum, item) => sum + item.importance, 0) / entries.length,
      rankedLevels: rankItems(levels, "score"),
    };
  });
  return rankItems(attributes, "importance");
}

export function rankDistribution(personas) {
  const ranked = personas.map((persona) => rankAttributes(persona).map((attribute) => ({
    ...attribute, personaId: persona.id, personaName: persona.name,
  })));
  const ids = [...new Set(ranked.flatMap((attributes) => attributes.map((a) => a.id)))];
  const rankCount = Math.max(0, ...ranked.map((attributes) => attributes.length));
  return ids.map((id) => {
    const entries = ranked.flatMap((attributes) => attributes.filter((a) => a.id === id));
    return {
      id, name: entries[0].name, total: entries.length,
      counts: Array.from({ length: rankCount }, (_, index) => entries.filter((a) => a.rank === index + 1).length),
      meanRank: entries.reduce((sum, a) => sum + a.rank, 0) / entries.length,
      personaRanks: entries.map((a) => ({ personaId: a.personaId, personaName: a.personaName, rank: a.rank, importance: a.importance })),
    };
  }).sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name));
}
