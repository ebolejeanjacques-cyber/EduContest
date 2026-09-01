/**
 * seed.js
 * -----------------------------------------------------------------------
 * Données de démonstration — VERSION FIRESTORE.
 *
 * Avec IndexedDB, la démo pouvait créer automatiquement 3 comptes
 * (admin/organisateur/participant) au premier chargement, car la base
 * était propre à chaque navigateur. Avec Firestore, la base est PARTAGÉE
 * entre tous les appareils : créer des comptes automatiquement à chaque
 * ouverture de page n'a plus de sens, et surtout, le SDK Firebase
 * Authentication CONNECTE automatiquement tout compte qu'il crée — un
 * script de seed automatique déconnecterait donc l'administrateur en
 * train de l'exécuter pour le reconnecter sous un compte de démo !
 *
 * C'est pourquoi :
 *  - Les 3 comptes de démonstration doivent être créés manuellement, une
 *    fois, via la page d'inscription normale (voir README.md) ;
 *  - Ce fichier se contente de peupler le CONTENU de démonstration
 *    (catégories, concours, questions, et éventuellement un résultat
 *    d'exemple) une fois que ces comptes existent, via un bouton dans
 *    l'espace administrateur (admin/settings.html).
 *
 * `seedDemoContent({ organizerId, participantId })` :
 *   - organizerId (obligatoire) : uid Firestore de l'organisateur auquel
 *     les concours de démo seront rattachés.
 *   - participantId (optionnel) : si fourni, une participation + un
 *     résultat de démonstration sont créés pour illustrer le classement.
 * -----------------------------------------------------------------------
 */

async function seedDemoContent({ organizerId, participantId }) {
  if (!organizerId) {
    throw new Error("Un organisateur doit être sélectionné pour créer les concours de démonstration.");
  }

  const now = new Date().toISOString();

  // ---- Catégories (créées seulement si elles n'existent pas déjà) -----
  const existingCategories = await DB.getAll("categories");
  const findOrCreateCategory = async (name) => {
    const existing = existingCategories.find((c) => c.name === name);
    if (existing) return existing;
    const cat = { id: DB.generateId(), name };
    await DB.add("categories", cat);
    existingCategories.push(cat);
    return cat;
  };

  const catMath = await findOrCreateCategory("Mathématiques");
  const catInfo = await findOrCreateCategory("Informatique");
  const catCulture = await findOrCreateCategory("Culture générale");

  // ---- Concours ---------------------------------------------------
  const start1 = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const end1 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString();
  const comp1 = {
    id: DB.generateId(),
    title: "Concours de Logique Mathématique",
    description: "Un concours pour tester vos bases en algèbre, arithmétique et raisonnement logique.",
    categoryId: catMath.id,
    level: "Intermédiaire",
    startDate: start1,
    endDate: end1,
    duration: 10,
    questionCount: 5,
    pointsPerQuestion: 2,
    organizerId,
    status: "En cours",
    createdAt: now,
  };

  const start2 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
  const end2 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString();
  const comp2 = {
    id: DB.generateId(),
    title: "Quiz Culture Générale Africaine",
    description: "Testez vos connaissances sur l'histoire, la géographie et les traditions.",
    categoryId: catCulture.id,
    level: "Débutant",
    startDate: start2,
    endDate: end2,
    duration: 8,
    questionCount: 4,
    pointsPerQuestion: 2,
    organizerId,
    status: "À venir",
    createdAt: now,
  };

  const start3 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString();
  const end3 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
  const comp3 = {
    id: DB.generateId(),
    title: "Défi Programmation Web",
    description: "Concepts fondamentaux du HTML, CSS, JavaScript et algorithmique.",
    categoryId: catInfo.id,
    level: "Avancé",
    startDate: start3,
    endDate: end3,
    duration: 12,
    questionCount: 4,
    pointsPerQuestion: 3,
    organizerId,
    status: "Terminé",
    createdAt: now,
  };

  await DB.add("competitions", comp1);
  await DB.add("competitions", comp2);
  await DB.add("competitions", comp3);

  // ---- Questions --------------------------------------------------
  const questionsComp1 = [
    { text: "Combien font 7 x 8 ?", optionA: "54", optionB: "56", optionC: "58", optionD: "64", correctAnswer: "B" },
    { text: "Quelle est la racine carrée de 81 ?", optionA: "7", optionB: "8", optionC: "9", optionD: "10", correctAnswer: "C" },
    { text: "Si x + 5 = 12, alors x = ?", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctAnswer: "C" },
    { text: "Quel est le résultat de 15 % de 200 ?", optionA: "20", optionB: "25", optionC: "30", optionD: "35", correctAnswer: "C" },
    { text: "Combien de côtés a un hexagone ?", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctAnswer: "B" },
  ];

  const questionsComp2 = [
    { text: "Quel est le plus grand lac d'Afrique ?", optionA: "Lac Tanganyika", optionB: "Lac Victoria", optionC: "Lac Malawi", optionD: "Lac Kivu", correctAnswer: "B" },
    { text: "Combien de pays compte le continent africain ?", optionA: "48", optionB: "54", optionC: "60", optionD: "42", correctAnswer: "B" },
    { text: "Quelle est la capitale du Burundi ?", optionA: "Bujumbura", optionB: "Gitega", optionC: "Ngozi", optionD: "Rumonge", correctAnswer: "B" },
    { text: "Quel fleuve est le plus long du monde ?", optionA: "Le Congo", optionB: "Le Niger", optionC: "Le Nil", optionD: "Le Zambèze", correctAnswer: "C" },
  ];

  const questionsComp3 = [
    { text: "Quelle balise HTML définit un lien hypertexte ?", optionA: "<link>", optionB: "<a>", optionC: "<href>", optionD: "<nav>", correctAnswer: "B" },
    { text: "En CSS, quelle propriété modifie la couleur du texte ?", optionA: "font-color", optionB: "text-color", optionC: "color", optionD: "background-color", correctAnswer: "C" },
    { text: "Quelle méthode JavaScript ajoute un élément à la fin d'un tableau ?", optionA: "push()", optionB: "pop()", optionC: "shift()", optionD: "concat()", correctAnswer: "A" },
    { text: "Quelle base de données cloud est utilisée dans ce projet ?", optionA: "MySQL", optionB: "MongoDB", optionC: "Cloud Firestore", optionD: "SQLite", correctAnswer: "C" },
  ];

  async function addQuestions(list, competitionId, points) {
    for (const q of list) {
      await DB.add("questions", { id: DB.generateId(), competitionId, points, ...q });
    }
  }

  await addQuestions(questionsComp1, comp1.id, comp1.pointsPerQuestion);
  await addQuestions(questionsComp2, comp2.id, comp2.pointsPerQuestion);
  const comp3Questions = questionsComp3;
  await addQuestions(comp3Questions, comp3.id, comp3.pointsPerQuestion);

  // ---- Participation + résultat de démonstration (optionnel) ----------
  if (participantId) {
    const participation = {
      id: DB.generateId(),
      competitionId: comp3.id,
      userId: participantId,
      status: "Terminé",
      startedAt: start3,
      submittedAt: end3,
      timeUsed: 600,
    };
    await DB.add("participations", participation);

    let score = 0;
    let correctCount = 0;
    for (const q of await DB.queryByIndex("questions", "competitionId", comp3.id)) {
      const isCorrect = Math.random() > 0.4;
      if (isCorrect) {
        score += q.points;
        correctCount++;
      }
      await DB.add("answers", {
        id: DB.generateId(),
        participationId: participation.id,
        questionId: q.id,
        selected: isCorrect ? q.correctAnswer : "A",
        isCorrect,
      });
    }
    const maxScore = comp3Questions.reduce((sum, q, i) => sum + comp3.pointsPerQuestion, 0);

    await DB.add("results", {
      id: DB.generateId(),
      participationId: participation.id,
      competitionId: comp3.id,
      userId: participantId,
      score,
      maxScore,
      percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
      correctCount,
      wrongCount: comp3Questions.length - correctCount,
      timeUsed: participation.timeUsed,
      createdAt: end3,
    });
  }

  return { categories: [catMath, catInfo, catCulture], competitions: [comp1, comp2, comp3] };
}

window.seedDemoContent = seedDemoContent;
