/**
 * questions.js
 * -----------------------------------------------------------------------
 * Gestion des questions à choix multiples (QCM) rattachées à un concours.
 * -----------------------------------------------------------------------
 */

async function addQuestion(competitionId, data, points) {
  const q = {
    id: DB.generateId("q"),
    competitionId,
    text: data.text.trim(),
    optionA: data.optionA.trim(),
    optionB: data.optionB.trim(),
    optionC: data.optionC.trim(),
    optionD: data.optionD.trim(),
    correctAnswer: data.correctAnswer,
    points: Number(points) || 1,
  };
  await DB.add("questions", q);
  return q;
}

async function updateQuestion(id, data) {
  const q = await DB.get("questions", id);
  if (!q) throw new Error("Question introuvable.");
  Object.assign(q, {
    text: data.text.trim(),
    optionA: data.optionA.trim(),
    optionB: data.optionB.trim(),
    optionC: data.optionC.trim(),
    optionD: data.optionD.trim(),
    correctAnswer: data.correctAnswer,
    points: Number(data.points) || q.points,
  });
  await DB.put("questions", q);
  return q;
}

async function deleteQuestion(id) {
  await DB.delete("questions", id);
  return true;
}

async function getQuestionsForCompetition(competitionId) {
  return DB.queryByIndex("questions", "competitionId", competitionId);
}

window.Questions = {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsForCompetition,
};
