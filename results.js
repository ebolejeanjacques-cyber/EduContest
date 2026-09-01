/**
 * results.js
 * -----------------------------------------------------------------------
 * Fonctions de lecture / agrégation des résultats (utilisées par le
 * participant, l'organisateur et l'administrateur).
 * -----------------------------------------------------------------------
 */

/** Retourne le résultat d'une participation donnée. */
async function getResultForParticipation(participationId) {
  const list = await DB.queryByIndex("results", "participationId", participationId);
  return list[0] || null;
}

/** Retourne tous les résultats d'un utilisateur, enrichis du concours. */
async function getResultsForUser(userId) {
  const list = await DB.queryByIndex("results", "userId", userId);
  const comps = await DB.getAll("competitions");
  const compMap = {};
  comps.forEach((c) => (compMap[c.id] = c));
  return list
    .map((r) => ({ ...r, competition: compMap[r.competitionId] || null }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Retourne tous les résultats d'un concours, enrichis de l'utilisateur. */
async function getResultsForCompetition(competitionId) {
  const list = await DB.queryByIndex("results", "competitionId", competitionId);
  const users = await DB.getAll("users");
  const userMap = {};
  users.forEach((u) => (userMap[u.id] = u));
  return list.map((r) => ({ ...r, user: userMap[r.userId] || null }));
}

/** Retourne les réponses détaillées d'une participation avec le texte des questions. */
async function getAnswerDetails(participationId) {
  const answers = await DB.queryByIndex("answers", "participationId", participationId);
  const details = [];
  for (const a of answers) {
    const question = await DB.get("questions", a.questionId);
    details.push({ ...a, question });
  }
  return details;
}

/** Statistiques globales pour le tableau de bord admin. */
async function getGlobalStats() {
  const [users, competitions, results, participations] = await Promise.all([
    DB.getAll("users"),
    DB.getAll("competitions"),
    DB.getAll("results"),
    DB.getAll("participations"),
  ]);
  return {
    totalUsers: users.length,
    totalParticipants: users.filter((u) => u.role === "participant").length,
    totalOrganizers: users.filter((u) => u.role === "organizer").length,
    totalAdmins: users.filter((u) => u.role === "admin").length,
    totalCompetitions: competitions.length,
    totalResults: results.length,
    totalParticipations: participations.length,
  };
}

window.Results = {
  getResultForParticipation,
  getResultsForUser,
  getResultsForCompetition,
  getAnswerDetails,
  getGlobalStats,
};
