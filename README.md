# EduContest — Plateforme de concours éducatifs (Firebase)

EduContest est une application web statique (HTML5, CSS3, Bootstrap 5,
JavaScript vanilla) qui utilise **Firebase Authentication** et **Cloud
Firestore** comme backend, afin que les mêmes données (utilisateurs,
concours, questions, participations, réponses, résultats) soient
partagées entre tous les appareils : un participant inscrit depuis son
téléphone est immédiatement visible par l'organisateur connecté sur son
PC, et inversement.

Aucun serveur, aucune base MySQL, aucun framework (React/Vue/Angular) :
uniquement des fichiers HTML/CSS/JS statiques + Firebase.

---

## 1. Créer un projet Firebase

1. Rendez-vous sur [https://console.firebase.google.com](https://console.firebase.google.com).
2. Cliquez sur **"Ajouter un projet"**.
3. Donnez-lui un nom (ex. `educontest-demo`), puis suivez les étapes
   (vous pouvez désactiver Google Analytics, non nécessaire ici).
4. Une fois le projet créé, vous arrivez sur son tableau de bord.

## 2. Activer Firebase Authentication

1. Dans le menu de gauche, cliquez sur **Build → Authentication**.
2. Cliquez sur **"Get started"** (ou "Commencer").
3. Dans l'onglet **"Sign-in method"**, cliquez sur **"Email/Password"**.
4. Activez le premier interrupteur ("Email/Password"), laissez le second
   ("Email link") désactivé, puis **Enregistrer**.

## 3. Créer la base Firestore

1. Toujours dans le menu de gauche, cliquez sur **Build → Firestore Database**.
2. Cliquez sur **"Créer une base de données"**.
3. Choisissez une région proche de vos utilisateurs (ex. `europe-west1`).
4. Démarrez en **mode production** (nous installerons nos propres règles
   à l'étape 7 — ne laissez jamais un projet réel en "mode test", qui
   autorise tout le monde à tout lire/écrire).

## 4. Récupérer la configuration Firebase

1. Cliquez sur l'icône **⚙️ (Paramètres du projet)** en haut du menu de
   gauche, puis **"Paramètres du projet"**.
2. Descendez jusqu'à **"Vos applications"** et cliquez sur l'icône **`</>`**
   (Web) pour créer une application web.
3. Donnez-lui un surnom (ex. `EduContest Web`), **ne cochez pas** "Firebase
   Hosting" (non nécessaire, le projet tourne avec Live Server).
4. Firebase affiche un bloc `const firebaseConfig = { ... }` : copiez ces
   valeurs.

## 5. Placer la configuration dans le projet

Ouvrez le fichier :

```text
js/firebase-config.js
```

Remplacez les valeurs `"YOUR_..."` par celles copiées à l'étape 4 :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "educontest-demo.firebaseapp.com",
  projectId: "educontest-demo",
  storageBucket: "educontest-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};
```

Enregistrez le fichier. **Ne partagez pas ce fichier publiquement** avec
des clés de production sensibles sans avoir mis en place des règles de
sécurité Firestore adaptées (voir étape 7) — la clé `apiKey` Firebase
n'est pas un secret à proprement parler (elle identifie le projet, elle
ne donne pas d'accès), mais l'accès réel aux données est entièrement
déterminé par `firestore.rules`.

## 6. Ouvrir le projet avec Live Server

1. Ouvrez le dossier `EduContest/` dans **VS Code**.
2. Installez l'extension **"Live Server"** (Ritwick Dey) si ce n'est pas
   déjà fait.
3. Clic droit sur `index.html` → **"Open with Live Server"**.
4. Le site s'ouvre sur `http://127.0.0.1:5500` (ou un port similaire).
   Firestore et Firebase Authentication nécessitent une origine
   `http://` ou `https://` — n'ouvrez pas les fichiers directement avec
   `file://`.

## 7. Installer les règles de sécurité Firestore

1. Dans la Console Firebase, allez dans **Firestore Database → onglet
   "Règles"**.
2. Supprimez le contenu par défaut et collez-y l'intégralité du fichier
   [`firestore.rules`](./firestore.rules) fourni à la racine de ce projet.
3. Cliquez sur **"Publier"**.

Ces règles empêchent notamment :
- un participant de modifier les données d'un autre participant ;
- un participant de modifier une question (impossible de tricher) ;
- un participant de modifier ses propres résultats après coup ;
- un organisateur de modifier les concours d'un autre organisateur ;
- un utilisateur non connecté d'écrire quoi que ce soit dans Firestore.

## 8. Créer les comptes de démonstration

Avec Firebase, les comptes doivent être créés via de vraies actions
d'inscription (Firebase Authentication ne peut pas être "pré-rempli"
sans passer par le SDK Admin, indisponible côté frontend pur). Procédez
ainsi, une seule fois :

1. Lancez le projet avec Live Server (étape 6).
2. Allez sur `register.html` et créez, dans l'ordre :
   - **`participant@educontest.local`** / mot de passe de votre choix
     (6 caractères minimum) / rôle **Participant**.
   - **`organisateur@educontest.local`** / mot de passe / rôle
     **Organisateur**.
   - **`admin@educontest.local`** / mot de passe / rôle **Organisateur**
     *(le formulaire d'inscription ne propose que Participant ou
     Organisateur — c'est voulu, voir la note de sécurité ci-dessous)*.
3. Promouvoir le compte admin :
   - Dans la Console Firebase, allez dans **Firestore Database → Données**.
   - Ouvrez la collection **`users`**, trouvez le document correspondant
     à `admin@educontest.local` (vous pouvez identifier le bon document
     via son champ `email`).
   - Modifiez son champ **`role`** : remplacez `organizer` par `admin`.
   - Enregistrez.
4. Reconnectez-vous avec `admin@educontest.local` sur `login.html` : vous
   arrivez maintenant sur le tableau de bord administrateur.

> **Pourquoi cette étape manuelle ?** Nos règles de sécurité
> (`firestore.rules`) interdisent volontairement à un utilisateur de se
> définir lui-même comme "admin" à l'inscription (sinon n'importe qui
> pourrait devenir administrateur). La toute première promotion d'un
> compte administrateur doit donc se faire manuellement, une seule fois,
> depuis la Console Firebase — qui agit ici comme un accès "de
> confiance" équivalent à un accès serveur.

## 9. Générer le contenu de démonstration

Une fois connecté en tant qu'administrateur :

1. Allez dans **Paramètres** (menu de gauche de l'espace admin).
2. Dans le bloc **"Données de démonstration"**, sélectionnez le compte
   organisateur créé à l'étape 8, et éventuellement le compte
   participant, puis cliquez sur **"Créer les données de démonstration"**.
3. Cela crée 3 catégories, 3 concours (à venir / en cours / terminé) et
   leurs questions dans Firestore, immédiatement visibles par tous les
   appareils connectés au même projet.

## 10. Lancer et tester

```text
Chrome PC        → http://127.0.0.1:5500 (Live Server)
Chrome Android   → http://<IP locale de votre PC>:5500 (même réseau Wi-Fi)
```

Pour tester depuis un téléphone sur le même réseau Wi-Fi que votre PC,
remplacez `127.0.0.1` par l'adresse IP locale de votre PC (ex.
`192.168.1.42:5500`), visible dans les paramètres réseau de votre
ordinateur, ou utilisez l'option "Live Server → Go Live" qui affiche
généralement cette adresse.

---

## Architecture du projet

```text
EduContest/
├── index.html, login.html, register.html
├── css/style.css
├── firestore.rules
├── README.md
├── js/
│   ├── firebase-config.js   → configuration + initialisation Firebase (À REMPLIR)
│   ├── database.js          → couche d'accès Firestore (API DB.add/get/getAll/...)
│   ├── auth.js               → Firebase Authentication + profils Firestore
│   ├── app.js                 → navbar, sidebar, alertes, gardes-fous de pages
│   ├── seed.js                 → génération manuelle du contenu de démonstration
│   ├── competitions.js, questions.js, participants.js, results.js, ranking.js
├── public/details.html, public/ranking.html
├── participant/ (dashboard, competitions, details, exam, result, history, ranking, profile)
├── organizer/ (dashboard, create-competition, competitions, questions, participants, results)
└── admin/ (dashboard, users, competitions, categories, results, settings)
```

## Ce qui a changé par rapport à la version IndexedDB

- **`js/database.js`** : entièrement réécrit pour interroger Cloud
  Firestore au lieu d'IndexedDB, en conservant exactement la même API
  (`DB.add`, `DB.put`, `DB.get`, `DB.getAll`, `DB.delete`,
  `DB.queryByIndex`, `DB.getByIndex`, `DB.exportAllData`,
  `DB.importAllData`). Deux nouvelles fonctions ont été ajoutées :
  `DB.listenAll()` et `DB.listenQuery()`, basées sur `onSnapshot()`, pour
  les mises à jour en temps réel.
- **`js/auth.js`** : remplace le hachage local par de vraies fonctions
  Firebase Authentication (`createUserWithEmailAndPassword`,
  `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`). Le mot
  de passe n'est plus jamais stocké dans Firestore.
- **`js/firebase-config.js`** *(nouveau)* : configuration du projet Firebase.
- **`js/seed.js`** : ne crée plus de comptes automatiquement (cela
  déconnecterait l'administrateur en train de l'exécuter) ; génère
  uniquement le contenu (catégories/concours/questions) via un bouton
  dans l'espace admin.
- **`competitions.js`, `questions.js`, `participants.js`, `results.js`,
  `ranking.js`** : **inchangés**, car ils n'appellent que l'API générique
  `DB.*`, désormais branchée sur Firestore.
- **Toutes les pages HTML** : ajout des scripts Firebase SDK (compat) +
  `firebase-config.js` avant `database.js` ; les appels à
  `App.initProtectedPage(...)` sont maintenant précédés de `await` (la
  confirmation de session Firebase est asynchrone).
- **`organizer/participants.html`** et **`participant/competitions.html`** :
  utilisent désormais `DB.listenQuery` / `DB.listenAll` pour se mettre à
  jour en temps réel — ce sont les deux pages qui illustrent le mieux la
  synchronisation multi-appareils demandée.
- **`admin/users.html`** : la création de nouveaux comptes n'est plus
  possible depuis cet écran (créer un compte Firebase Authentication
  côté client déconnecterait l'administrateur) ; seuls le nom et le rôle
  d'un compte existant peuvent être modifiés.
- **`firestore.rules`** *(nouveau)* : règles de sécurité côté serveur Firebase.

---

## Checklist de mise en route

```text
[ ] Projet Firebase créé
[ ] Authentication activée (Email/Password)
[ ] Firestore Database créée
[ ] Configuration copiée dans js/firebase-config.js
[ ] Règles firestore.rules publiées
[ ] Compte participant@educontest.local créé (via register.html)
[ ] Compte organisateur@educontest.local créé (via register.html)
[ ] Compte admin@educontest.local créé (via register.html) puis promu "admin" dans Firestore
[ ] Données de démonstration générées (admin/settings.html)
[ ] Test inscription (nouveau compte participant)
[ ] Test participation (inscription à un concours + épreuve)
[ ] Test résultat (score calculé automatiquement)
[ ] Test classement (position, tri score puis temps)
[ ] Test téléphone → PC (participant s'inscrit sur téléphone,
     l'organisateur voit la participation sur PC sans rafraîchir)
[ ] Test PC → téléphone (organisateur crée un concours sur PC,
     le participant le voit sur téléphone sans rafraîchir)
```

### Le test le plus important

```text
📱 Téléphone                          💻 PC
Participant s'inscrit à              Organisateur ouvre
un concours (participant/details)    organizer/participants.html
        ↓                                    ↑
        └────────────→ ☁️ Firestore ─────────┘
              (onSnapshot déclenche la mise à jour automatique)
```

Puis l'inverse :

```text
💻 PC                                  📱 Téléphone
Organisateur crée un concours         Participant ouvre
(organizer/create-competition)        participant/competitions.html
        ↓                                    ↑
        └────────────→ ☁️ Firestore ─────────┘
```

Si les deux fonctionnent sans qu'aucun des deux appareils n'ait besoin de
recharger la page, la synchronisation multi-appareils est opérationnelle.
