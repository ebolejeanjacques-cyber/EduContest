/**
 * ranking.js
 * -----------------------------------------------------------------------
 * Calcule les classements : global (tous concours confondus, meilleur
 * résultat par participant) et par concours (tous les résultats, triés).
 * Critère principal : pourcentage / score décroissant.
 * Critère secondaire (départage) : temps utilisé croissant (le plus rapide
 * gagne en cas d'égalité de score).
 * -----------------------------------------------------------------------
 */

function sortByScoreThenTime(list) {
  return [...list].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeUsed || 0) - (b.timeUsed || 0); // plus rapide d'abord
  });
}

/** Classement pour un concours précis. */
async function getRankingForCompetition(competitionId) {
  const results = await Results.getResultsForCompetition(competitionId);
  const sorted = sortByScoreThenTime(results);
  return sorted.map((r, index) => ({ position: index + 1, ...r }));
}

/**
 * Classement public global : meilleur résultat de chaque participant,
 * tous concours confondus.
 */
async function getGlobalRanking() {
  const allResults = await DB.getAll("results");
  const users = await DB.getAll("users");
  const competitions = await DB.getAll("competitions");
  const userMap = {};
  users.forEach((u) => (userMap[u.id] = u));
  const compMap = {};
  competitions.forEach((c) => (compMap[c.id] = c));

  // On garde le meilleur résultat (pourcentage le plus élevé) par utilisateur.
  const bestByUser = {};
  for (const r of allResults) {
    const current = bestByUser[r.userId];
    if (!current || r.percentage > current.percentage) {
      bestByUser[r.userId] = r;
    }
  }

  const enriched = Object.values(bestByUser).map((r) => ({
    ...r,
    user: userMap[r.userId] || null,
    competition: compMap[r.competitionId] || null,
  }));

  const sorted = sortByScoreThenTime(enriched);
  return sorted.map((r, index) => ({ position: index + 1, ...r }));
}

window.Ranking = {
  getRankingForCompetition,
  getGlobalRanking,
};
