/**
 * database.js
 * -----------------------------------------------------------------------
 * Couche d'accès aux données pour EduContest — VERSION FIRESTORE.
 *
 * Ce fichier remplace l'ancienne version basée sur IndexedDB. Il expose
 * EXACTEMENT LA MÊME API (`DB.add`, `DB.put`, `DB.get`, `DB.getAll`,
 * `DB.delete`, `DB.queryByIndex`, `DB.getByIndex`, `DB.clear`,
 * `DB.exportAllData`, `DB.importAllData`, `DB.generateId`) afin que tous
 * les autres fichiers (competitions.js, questions.js, participants.js,
 * results.js, ranking.js, seed.js) continuent de fonctionner SANS AUCUNE
 * MODIFICATION. Seule l'implémentation change : les données sont
 * maintenant stockées dans Cloud Firestore et partagées en temps réel
 * entre tous les appareils connectés au même projet Firebase.
 *
 * Deux fonctions supplémentaires sont ajoutées pour la synchronisation
 * temps réel multi-appareils : `DB.listenAll` et `DB.listenQuery`, basées
 * sur `onSnapshot()`. Elles sont utilisées par les pages qui doivent se
 * mettre à jour automatiquement (ex. liste des participants côté
 * organisateur, liste des concours côté participant).
 *
 * Collections Firestore utilisées (équivalent des anciens "object stores") :
 *   users, categories, competitions, questions, participations, answers, results
 * -----------------------------------------------------------------------
 */

// `firebase` est l'objet global fourni par les scripts CDN "compat" chargés
// avant ce fichier (voir les balises <script> en haut de chaque page HTML).
// `firebase.initializeApp()` a déjà été appelé dans firebase-config.js.
const firestore = firebase.firestore();

const ALL_COLLECTIONS = [
  "users",
  "categories",
  "competitions",
  "questions",
  "participations",
  "answers",
  "results",
];

/**
 * Génère un identifiant unique global, garanti unique entre TOUS les
 * appareils (contrairement à l'ancien générateur local basé sur
 * Date.now() + Math.random(), suffisant pour IndexedDB mais pas pour une
 * base partagée). On utilise pour cela le générateur d'ID de Firestore
 * lui-même (`collection().doc().id`), sans réellement créer de document.
 * Le paramètre `prefix` est conservé pour compatibilité mais n'est plus
 * utilisé (les ID Firestore ne sont pas préfixables).
 */
function generateId(prefix = "id") {
  return firestore.collection("_").doc().id;
}

/** Ajoute un document. Si `record.id` n'est pas fourni, un ID est généré. */
function dbAdd(storeName, record) {
  if (!record.id) record.id = generateId();
  return firestore
    .collection(storeName)
    .doc(record.id)
    .set(record)
    .then(() => record);
}

/** Crée ou remplace intégralement un document identifié par `record.id`. */
function dbPut(storeName, record) {
  if (!record.id) record.id = generateId();
  return firestore
    .collection(storeName)
    .doc(record.id)
    .set(record)
    .then(() => record);
}

/** Récupère un document par son id. Retourne `null` s'il n'existe pas. */
function dbGet(storeName, id) {
  if (!id) return Promise.resolve(null);
  return firestore
    .collection(storeName)
    .doc(id)
    .get()
    .then((snap) => (snap.exists ? snap.data() : null));
}

/** Récupère tous les documents d'une collection. */
function dbGetAll(storeName) {
  return firestore
    .collection(storeName)
    .get()
    .then((snap) => snap.docs.map((d) => d.data()));
}

/** Supprime un document par son id. */
function dbDelete(storeName, id) {
  return firestore
    .collection(storeName)
    .doc(id)
    .delete()
    .then(() => true);
}

/** Recherche tous les documents dont le champ `fieldName` == `value`. */
function dbQueryByIndex(storeName, fieldName, value) {
  return firestore
    .collection(storeName)
    .where(fieldName, "==", value)
    .get()
    .then((snap) => snap.docs.map((d) => d.data()));
}

/** Récupère le premier document dont `fieldName` == `value` (ex : email). */
function dbGetByIndex(storeName, fieldName, value) {
  return dbQueryByIndex(storeName, fieldName, value).then((list) => list[0] || null);
}

/** Supprime tous les documents d'une collection (utilisé par l'import). */
function dbClear(storeName) {
  return firestore
    .collection(storeName)
    .get()
    .then((snap) => Promise.all(snap.docs.map((d) => d.ref.delete())))
    .then(() => true);
}

/** Exporte toutes les collections de la plateforme sous forme d'objet JSON. */
async function exportAllData() {
  const data = {};
  for (const storeName of ALL_COLLECTIONS) {
    data[storeName] = await dbGetAll(storeName);
  }
  data._meta = { exportedAt: new Date().toISOString(), source: "Firestore" };
  return data;
}

/**
 * Importe des données JSON précédemment exportées.
 * Utilise `set()` avec le même `id` pour chaque document : un document
 * existant portant le même id est donc écrasé (pas de doublon), et un
 * nouveau document est créé sinon. Les autres documents déjà présents
 * dans Firestore mais absents du fichier importé sont conservés tels
 * quels (l'import ne vide pas les collections).
 */
async function importAllData(data) {
  for (const storeName of ALL_COLLECTIONS) {
    if (Array.isArray(data[storeName])) {
      for (const record of data[storeName]) {
        if (record && record.id) {
          await dbPut(storeName, record);
        }
      }
    }
  }
  return true;
}

/**
 * Écoute en temps réel TOUS les documents d'une collection.
 * `callback(list)` est appelé immédiatement puis à chaque changement
 * (ajout/modification/suppression) effectué depuis n'importe quel appareil.
 * Retourne une fonction `unsubscribe()` à appeler pour arrêter l'écoute
 * (ex. quand l'utilisateur quitte la page).
 */
function listenAll(storeName, callback) {
  return firestore.collection(storeName).onSnapshot(
    (snap) => callback(snap.docs.map((d) => d.data())),
    (err) => console.error(`[DB.listenAll:${storeName}]`, err)
  );
}

/**
 * Écoute en temps réel les documents d'une collection filtrés par
 * `fieldName == value`. Mêmes principes que `listenAll`.
 */
function listenQuery(storeName, fieldName, value, callback) {
  return firestore
    .collection(storeName)
    .where(fieldName, "==", value)
    .onSnapshot(
      (snap) => callback(snap.docs.map((d) => d.data())),
      (err) => console.error(`[DB.listenQuery:${storeName}]`, err)
    );
}

/**
 * Conservé pour compatibilité avec le code existant : chaque page appelle
 * `await DB.openDatabase()` avant de l'utiliser. Avec Firestore, il n'y a
 * rien à "ouvrir" (pas de schéma à créer côté client), donc cette fonction
 * ne fait rien d'autre que retourner une Promise résolue.
 */
function openDatabase() {
  return Promise.resolve(true);
}

window.DB = {
  openDatabase,
  generateId,
  add: dbAdd,
  put: dbPut,
  get: dbGet,
  getAll: dbGetAll,
  delete: dbDelete,
  queryByIndex: dbQueryByIndex,
  getByIndex: dbGetByIndex,
  clear: dbClear,
  exportAllData,
  importAllData,
  listenAll,
  listenQuery,
};
