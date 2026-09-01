/**
 * app.js
 * -----------------------------------------------------------------------
 * Fonctions utilitaires partagées par toutes les pages : affichage du
 * nom de l'utilisateur connecté dans la navbar, gestion du bouton
 * déconnexion, alertes Bootstrap, badges de statut, formatage de dates,
 * calcul automatique du statut d'un concours selon les dates.
 * -----------------------------------------------------------------------
 */

/** Formate une date ISO en format lisible fr-FR. */
function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Recalcule le statut réel d'un concours à partir des dates. */
function computeCompetitionStatus(comp) {
  const now = new Date();
  const start = new Date(comp.startDate);
  const end = new Date(comp.endDate);
  if (now < start) return "À venir";
  if (now > end) return "Terminé";
  return "En cours";
}

/** Classe Bootstrap correspondant à un statut. */
function statusBadgeClass(status) {
  switch (status) {
    case "En cours":
      return "bg-success";
    case "À venir":
      return "bg-warning text-dark";
    case "Terminé":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
}

function statusBadgeHtml(status) {
  return `<span class="badge ${statusBadgeClass(status)}">${status}</span>`;
}

/** Affiche une alerte Bootstrap temporaire dans un conteneur donné. */
function showAlert(containerId, message, type = "success") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Conteneur d'alerte #${containerId} introuvable.`);
    return;
  }
  const id = "alert_" + Date.now();
  container.innerHTML = `
    <div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    </div>`;
  if (type === "success") {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) bootstrap.Alert.getOrCreateInstance(el).close();
    }, 4000);
  }
}

/** Échappe le HTML pour éviter les injections dans les templates. */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Construit la navbar commune dans l'élément #main-navbar.
 * `rootPrefix` : "" pour la racine, "../" pour les sous-dossiers.
 */
function renderNavbar(rootPrefix = "") {
  const el = document.getElementById("main-navbar");
  if (!el) return;
  const user = Auth.getCurrentUser();

  let rightSide = "";
  if (user) {
    const dash = Auth.dashboardUrlForRole(user.role, rootPrefix);
    rightSide = `
      <span class="navbar-text me-3 d-none d-md-inline">
        <i class="bi bi-person-circle me-1"></i>${escapeHtml(user.name)}
        <span class="badge bg-light text-dark ms-1 text-uppercase">${escapeHtml(user.role)}</span>
      </span>
      <a class="btn btn-outline-light btn-sm me-2" href="${dash}">Mon espace</a>
      <button class="btn btn-warning btn-sm" id="logout-btn">Déconnexion</button>
    `;
  } else {
    rightSide = `
      <a class="btn btn-outline-light btn-sm me-2" href="${rootPrefix}login.html">Connexion</a>
      <a class="btn btn-warning btn-sm" href="${rootPrefix}register.html">Inscription</a>
    `;
  }

  el.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark navbar-brand-edu sticky-top">
    <div class="container">
      <a class="navbar-brand fw-bold" href="${rootPrefix}index.html">
        <i class="bi bi-mortarboard-fill me-1"></i>EduContest
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" href="${rootPrefix}index.html">Accueil</a></li>
          <li class="nav-item"><a class="nav-link" href="${rootPrefix}index.html#concours">Concours</a></li>
          <li class="nav-item"><a class="nav-link" href="${rootPrefix}public/ranking.html">Classement</a></li>
        </ul>
        <div class="d-flex align-items-center">${rightSide}</div>
      </div>
    </div>
  </nav>`;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.logoutUser();
      window.location.href = `${rootPrefix}index.html`;
    });
  }
}

/**
 * Construit la sidebar d'un espace (participant/organizer/admin).
 * `items` : [{ label, href, icon, active }]
 */
function renderSidebar(items, rootPrefix = "../") {
  const el = document.getElementById("main-sidebar");
  if (!el) return;
  const links = items
    .map(
      (it) => `
      <a href="${it.href}" class="list-group-item list-group-item-action ${it.active ? "active" : ""}">
        <i class="bi ${it.icon} me-2"></i>${it.label}
      </a>`
    )
    .join("");
  el.innerHTML = `<div class="list-group list-group-flush shadow-sm rounded">${links}</div>`;
}

/**
 * Petit garde-fou générique appelé en haut de chaque page protégée.
 * Devenu asynchrone avec Firebase Authentication : l'état de connexion
 * n'est confirmé qu'après un aller-retour avec Firebase au chargement de
 * la page (voir `Auth.ensureSession()`). Chaque appel doit donc être
 * précédé de `await` : `const user = await App.initProtectedPage(...)`.
 */
async function initProtectedPage(allowedRoles, rootPrefix = "../") {
  const user = await Auth.requireRole(allowedRoles, rootPrefix);
  return user;
}

window.App = {
  formatDate,
  formatDateTime,
  computeCompetitionStatus,
  statusBadgeClass,
  statusBadgeHtml,
  showAlert,
  escapeHtml,
  renderNavbar,
  renderSidebar,
  initProtectedPage,
};
