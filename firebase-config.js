/**
 * firebase-config.js
 * -----------------------------------------------------------------------
 * Configuration du projet Firebase utilisé par EduContest.
 *
 * ⚠️ À FAIRE AVANT DE LANCER LE PROJET ⚠️
 * Remplacez les valeurs "YOUR_..." ci-dessous par la configuration de VOTRE
 * projet Firebase (Console Firebase → ⚙️ Paramètres du projet → Vos
 * applications → application Web → "Config"). Voir le fichier README.md
 * à la racine du projet pour la procédure pas à pas complète.
 *
 * Ce fichier doit être chargé APRÈS les SDK Firebase (app, auth, firestore)
 * et AVANT tous les autres scripts du projet (auth.js, database.js, ...),
 * car il initialise l'application Firebase utilisée par toute la plateforme.
 * -----------------------------------------------------------------------
 */

const firebaseConfig = {
  apiKey: "AIzaSyDmDjrQZqENKQjJsWWadU2bYl5m5SLJQ0E",
  authDomain: "educontest-78df9.firebaseapp.com",
  projectId: "educontest-78df9",
  storageBucket: "educontest-78df9.firebasestorage.app",
  messagingSenderId: "996887581977",
  appId: "1:996887581977:web:584721533bbb5be7a6a188"
};

// Initialise l'application Firebase (SDK "compat", compatible avec de
// simples balises <script>, sans bundler ni npm).
firebase.initializeApp(firebaseConfig);

// Petite alerte visible uniquement dans la console développeur si la
// configuration n'a manifestement pas été remplie, pour éviter de perdre
// du temps à déboguer des erreurs Firestore/Auth peu explicites.
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.warn(
    "[EduContest] firebase-config.js contient encore des valeurs par défaut. " +
    "Remplacez-les par la configuration de votre propre projet Firebase (voir README.md)."
  );
}
