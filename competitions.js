/**
 * competitions.js
 * -----------------------------------------------------------------------
 * Logique métier liée aux concours : création, modification, suppression,
 * recherche/filtrage, et mise à jour automatique du statut selon les dates.
 * -----------------------------------------------------------------------
 */

async function createCompetition(data, organizerId) {
  const comp = {
    id: DB.generateId("comp"),
    title: data.title.trim(),
    description: data.description.trim(),
    categoryId: data.categoryId,
    level: data.level,
    startDate: data.startDate,
    endDate: data.endDate,
    duration: Number(data.duration),
    questionCount: Number(data.questionCount),
    pointsPerQuestion: Number(data.pointsPerQuestion),
    organizerId,
    status: data.status || "À venir",
    createdAt: new Date().toISOString(),
  };
  await DB.add("competitions", comp);
  return comp;
}

async function updateCompetition(id, data) {
  const comp = await DB.get("competitions", id);
  if (!comp) throw new Error("Concours introuvable.");
  Object.assign(comp, {
    title: data.title.trim(),
    description: data.description.trim(),
    categoryId: data.categoryId,
    level: data.level,
    startDate: data.startDate,
    endDate: data.endDate,
    duration: Number(data.duration),
    questionCount: Number(data.questionCount),
    pointsPerQuestion: Number(data.pointsPerQuestion),
    status: data.status || comp.status,
  });
  await DB.put("competitions", comp);
  return comp;
}

async function deleteCompetitionCascade(id) {
  // Supprime le concours et toutes les données liées (questions,
  // participations, réponses, résultats) pour garder la base cohérente.
  const questions = await DB.queryByIndex("questions", "competitionId", id);
  for (const q of questions) await DB.delete("questions", q.id);

  const participations = await DB.queryByIndex("participations", "competitionId", id);
  for (const p of participations) {
    const answers = await DB.queryByIndex("answers", "participationId", p.id);
    for (const a of answers) await DB.delete("answers", a.id);
    await DB.delete("participations", p.id);
  }

  const results = await DB.queryByIndex("results", "competitionId", id);
  for (const r of results) await DB.delete("results", r.id);

  await DB.delete("competitions", id);
  return true;
}

async function getAllCompetitionsWithLiveStatus() {
  const comps = await DB.getAll("competitions");
  return comps.map((c) => ({ ...c, status: App.computeCompetitionStatus(c) }));
}

async function getCompetitionsByOrganizer(organizerId) {
  const comps = await DB.queryByIndex("competitions", "organizerId", organizerId);
  return comps.map((c) => ({ ...c, status: App.computeCompetitionStatus(c) }));
}

async function getCategoryMap() {
  const cats = await DB.getAll("categories");
  const map = {};
  cats.forEach((c) => (map[c.id] = c.name));
  return map;
}

/** Filtre une liste de concours par texte de recherche, catégorie et statut. */
function filterCompetitions(list, { search = "", categoryId = "", status = "" } = {}) {
  const term = search.trim().toLowerCase();
  return list.filter((c) => {
    const matchesSearch =
      !term ||
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term);
    const matchesCategory = !categoryId || c.categoryId === categoryId;
    const matchesStatus = !status || c.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });
}

window.Competitions = {
  createCompetition,
  updateCompetition,
  deleteCompetitionCascade,
  getAllCompetitionsWithLiveStatus,
  getCompetitionsByOrganizer,
  getCategoryMap,
  filterCompetitions,
};
