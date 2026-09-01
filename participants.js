/**
 * participants.js
 * -----------------------------------------------------------------------
 * Gère le cycle de vie d'une participation d'un utilisateur à un concours :
 * inscription, démarrage de l'épreuve, enregistrement des réponses,
 * soumission, calcul automatique du score et création du résultat.
 * -----------------------------------------------------------------------
 */

/** Inscrit un participant à un concours (crée une participation "En attente"). */
async function registerToCompetition(competitionId, userId) {
  const existing = await getParticipation(competitionId, userId);
  if (existing) return existing;
  const participation = {
    id: DB.generateId("part"),
    competitionId,
    userId,
    status: "Inscrit",
    startedAt: null,
    submittedAt: null,
    timeUsed: 0,
  };
  await DB.add("participations", participation);
  return participation;
}

/** Retourne la participation d'un utilisateur à un concours donné (ou null). */
async function getParticipation(competitionId, userId) {
  const list = await DB.queryByIndex("participations", "competitionId", competitionId);
  return list.find((p) => p.userId === userId) || null;
}

/**
 * Démarre l'épreuve : passe le statut à "En cours" et note l'heure de départ.
 * IMPORTANT : `startedAt` n'est écrit qu'une seule fois (la toute première
 * fois que l'épreuve démarre). Comme cette donnée est maintenant partagée
 * via Firestore, un simple rafraîchissement de la page — ou la reprise de
 * l'épreuve depuis un autre appareil — ne doit PAS réinitialiser le
 * chronomètre : on continue de décompter depuis l'heure de départ
 * d'origine, quel que soit l'appareil utilisé.
 */
async function startExam(participationId) {
  const p = await DB.get("participations", participationId);
  if (!p) throw new Error("Participation introuvable.");
  if (p.status === "Terminé") return p; // déjà soumis, on ne relance rien
  if (!p.startedAt) {
    p.startedAt = new Date().toISOString();
  }
  if (p.status !== "En cours") {
    p.status = "En cours";
  }
  await DB.put("participations", p);
  return p;
}

/**
 * Soumet l'épreuve : enregistre toutes les réponses, calcule le score
 * automatiquement, et crée l'enregistrement de résultat.
 * `answersMap` : { questionId: "A"|"B"|"C"|"D"|null }
 */
async function submitExam(participation, questions, answersMap, timeUsedSeconds) {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;

  // On supprime d'éventuelles réponses précédentes (soumission déjà en cours).
  const previousAnswers = await DB.queryByIndex("answers", "participationId", participation.id);
  for (const a of previousAnswers) await DB.delete("answers", a.id);

  for (const q of questions) {
    maxScore += q.points;
    const selected = answersMap[q.id] || null;
    const isCorrect = selected !== null && selected === q.correctAnswer;
    if (isCorrect) {
      score += q.points;
      correctCount++;
    } else {
      wrongCount++;
    }
    await DB.add("answers", {
      id: DB.generateId("ans"),
      participationId: participation.id,
      questionId: q.id,
      selected,
      isCorrect,
    });
  }

  participation.status = "Terminé";
  participation.submittedAt = new Date().toISOString();
  participation.timeUsed = timeUsedSeconds;
  await DB.put("participations", participation);

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const result = {
    id: DB.generateId("res"),
    participationId: participation.id,
    competitionId: participation.competitionId,
    userId: participation.userId,
    score,
    maxScore,
    percentage,
    correctCount,
    wrongCount,
    timeUsed: timeUsedSeconds,
    createdAt: new Date().toISOString(),
  };
  await DB.add("results", result);
  return result;
}

/** Retourne toutes les participations d'un utilisateur, enrichies du concours. */
async function getParticipationsForUser(userId) {
  const list = await DB.queryByIndex("participations", "userId", userId);
  const comps = await DB.getAll("competitions");
  const compMap = {};
  comps.forEach((c) => (compMap[c.id] = c));
  return list.map((p) => ({ ...p, competition: compMap[p.competitionId] || null }));
}

/** Retourne toutes les participations à un concours donné, enrichies de l'utilisateur. */
async function getParticipantsForCompetition(competitionId) {
  const list = await DB.queryByIndex("participations", "competitionId", competitionId);
  const users = await DB.getAll("users");
  const userMap = {};
  users.forEach((u) => (userMap[u.id] = u));
  return list.map((p) => ({ ...p, user: userMap[p.userId] || null }));
}

window.Participants = {
  registerToCompetition,
  getParticipation,
  startExam,
  submitExam,
  getParticipationsForUser,
  getParticipantsForCompetition,
};
