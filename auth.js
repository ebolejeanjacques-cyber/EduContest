/**
 * auth.js
 * -----------------------------------------------------------------------
 * Système d'authentification — VERSION FIREBASE AUTHENTICATION.
 *
 * Remplace l'ancienne authentification "simulée côté client" (mot de passe
 * haché localement, comparé dans IndexedDB) par de vraies fonctions
 * Firebase Authentication (Email/Password). Le mot de passe n'est plus
 * jamais stocké dans Firestore ni géré par notre propre code : Firebase
 * s'en charge entièrement, de façon sécurisée, côté serveur Google.
 *
 * Chaque compte Firebase Authentication (identifié par un `uid`) possède
 * un document `users/{uid}` dans Firestore contenant les informations
 * complémentaires : nom, email, rôle. C'est CE document qui détermine les
 * autorisations dans l'application (participant / organizer / admin).
 *
 * ⚠️ NOTE DE SÉCURITÉ IMPORTANTE ⚠️
 * Le champ `role` stocké dans Firestore est modifiable par n'importe quel
 * client capable d'écrire dans la collection `users` (selon les règles de
 * sécurité définies dans firestore.rules). Nos règles interdisent à un
 * utilisateur de modifier son PROPRE rôle, mais dans une vraie plateforme
 * de production, le contrôle de rôles sensibles (ex. promotion en
 * administrateur) devrait idéalement passer par un mécanisme contrôlé
 * côté serveur (Cloud Functions + Firebase Admin SDK, "custom claims"),
 * et non par un simple champ Firestore modifiable côté client. Cette
 * application reste un projet académique frontend pur, sans backend.
 * -----------------------------------------------------------------------
 */

const SESSION_KEY = "educontest_session";
const auth = firebase.auth();

/**
 * Inscrit un nouvel utilisateur :
 *  1. crée le compte dans Firebase Authentication (email + mot de passe) ;
 *  2. récupère son `uid` généré par Firebase ;
 *  3. crée son profil Firestore (`users/{uid}`) avec le rôle choisi.
 * Firebase connecte automatiquement l'utilisateur après la création du
 * compte : `firebase.auth().currentUser` est déjà défini juste après.
 */
async function registerUser({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase().trim();

  const credential = await auth.createUserWithEmailAndPassword(normalizedEmail, password);
  const uid = credential.user.uid;

  const profile = {
    id: uid,
    name: name.trim(),
    email: normalizedEmail,
    role: role || "participant",
    createdAt: new Date().toISOString(),
  };
  await DB.put("users", profile);

  const session = { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Connecte un utilisateur via Firebase Authentication puis charge son profil Firestore. */
async function loginUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  let credential;
  try {
    credential = await auth.signInWithEmailAndPassword(normalizedEmail, password);
  } catch (err) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  const profile = await DB.get("users", credential.user.uid);
  if (!profile) {
    throw new Error(
      "Compte authentifié mais profil introuvable dans Firestore. Contactez un administrateur."
    );
  }

  const session = { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Déconnecte l'utilisateur de Firebase Authentication et efface la session locale. */
function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  return auth.signOut();
}

/**
 * Retourne la session mise en cache localement (rapide, synchrone).
 * Peut être légèrement en retard par rapport à l'état réel de Firebase
 * Authentication juste après un rechargement de page : utiliser
 * `ensureSession()` dans le code d'initialisation de chaque page pour
 * être certain que la session est à jour avant de vérifier les droits.
 */
function getCurrentUser() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

let _authReadyPromise = null;

/**
 * Attend que Firebase Authentication ait confirmé l'état de connexion
 * (connecté ou non) au chargement de la page, puis synchronise la session
 * locale (`sessionStorage`) avec le profil Firestore correspondant.
 * Nécessaire car Firebase restaure la connexion de façon asynchrone à
 * chaque rechargement de page (ex. navigation directe vers une URL,
 * ouverture d'un nouvel onglet) : sans cette étape, `getCurrentUser()`
 * pourrait renvoyer `null` alors que l'utilisateur est bien connecté.
 * Le résultat est mis en cache : cette fonction ne s'exécute qu'une fois
 * par chargement de page, même si elle est appelée depuis plusieurs
 * endroits (navbar, garde-fou de page protégée, etc.).
 */
function ensureSession() {
  if (_authReadyPromise) return _authReadyPromise;

  _authReadyPromise = new Promise((resolve) => {
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        sessionStorage.removeItem(SESSION_KEY);
        resolve(null);
        return;
      }
      try {
        const profile = await DB.get("users", firebaseUser.uid);
        if (!profile) {
          resolve(null);
          return;
        }
        const session = { id: profile.id, name: profile.name, email: profile.email, role: profile.role };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        resolve(session);
      } catch (err) {
        console.error("[Auth.ensureSession] Erreur de chargement du profil :", err);
        resolve(getCurrentUser()); // repli sur la valeur mise en cache localement
      }
    });
  });

  return _authReadyPromise;
}

/**
 * Protège une page : attend la confirmation de session Firebase, puis
 * redirige vers login.html si non connecté, ou vers le tableau de bord
 * approprié si le rôle ne correspond pas. Retourne l'utilisateur (Promise).
 */
async function requireRole(allowedRoles, rootPrefix = "../") {
  const user = await ensureSession();
  if (!user) {
    window.location.href = `${rootPrefix}login.html`;
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    window.location.href = dashboardUrlForRole(user.role, rootPrefix);
    return null;
  }
  return user;
}

/** Retourne l'URL du tableau de bord correspondant à un rôle. */
function dashboardUrlForRole(role, rootPrefix = "") {
  switch (role) {
    case "admin":
      return `${rootPrefix}admin/dashboard.html`;
    case "organizer":
      return `${rootPrefix}organizer/dashboard.html`;
    case "participant":
      return `${rootPrefix}participant/dashboard.html`;
    default:
      return `${rootPrefix}index.html`;
  }
}

window.Auth = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  ensureSession,
  requireRole,
  dashboardUrlForRole,
};
