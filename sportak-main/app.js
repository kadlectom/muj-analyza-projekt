const today = "2026-03-12";

const activityCatalog = {
  summer: [
    { key: "road-bike", label: "Silniční kolo", category: "Sportovní aktivity", unit: "km", index: 0.8, limit: "Bez omezení", max: null },
    { key: "mtb", label: "MTB", category: "Sportovní aktivity", unit: "km", index: 1, limit: "Bez omezení", max: null },
    { key: "inline-skates", label: "Brusle", category: "Sportovní aktivity", unit: "km", index: 1, limit: "Bez omezení", max: null },
    { key: "hiking", label: "Turistika", category: "Sportovní aktivity", unit: "km", index: 1.1, limit: "Bez omezení", max: null },
    { key: "mountain-hiking", label: "Vysokohorská turistika", category: "Sportovní aktivity", unit: "km", index: 1.5, limit: "Bez omezení", max: null },
    { key: "climbing", label: "Lezení", category: "Sportovní aktivity", unit: "min", index: 0.2, limit: "Max 240 min na zápis", max: 240 },
    { key: "water-sports", label: "Vodní sporty", category: "Sportovní aktivity", unit: "min", index: 0.18, limit: "Max 240 min na zápis", max: 240 },
    { key: "run", label: "Běh", category: "Sportovní aktivity", unit: "km", index: 1.2, limit: "Bez omezení", max: null },
    { key: "swim", label: "Plavání", category: "Sportovní aktivity", unit: "km", index: 4, limit: "Bez omezení", max: null },
    { key: "team-sport", label: "Týmový sport", category: "Sportovní aktivity", unit: "min", index: 0.18, limit: "Max 180 min na zápis", max: 180 },
    { key: "low-workout", label: "Cvičení - nízká intenzita", category: "Sportovní aktivity", unit: "min", index: 0.12, limit: "Max 180 min na zápis", max: 180 },
    { key: "mid-workout", label: "Cvičení - střední intenzita", category: "Sportovní aktivity", unit: "min", index: 0.18, limit: "Max 180 min na zápis", max: 180 },
    { key: "high-workout", label: "Cvičení - vysoká intenzita", category: "Sportovní aktivity", unit: "min", index: 0.24, limit: "Max 180 min na zápis", max: 180 },
    { key: "dance", label: "Tanec", category: "Sportovní aktivity", unit: "min", index: 0.15, limit: "Max 180 min na zápis", max: 180 },
    { key: "wellness", label: "Wellness", category: "Wellness a kultura", unit: "návštěva", index: 6, limit: "1 návštěva = 6 bodů", max: 1 },
    { key: "theatre", label: "Divadlo", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "cinema", label: "Kino", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "concert", label: "Koncert", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "exhibition", label: "Výstava", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "book", label: "Kniha", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 dokončená kniha = 8 bodů", max: 1 }
  ],
  winter: [
    { key: "downhill-ski", label: "Sjezdové lyže", category: "Zimní sporty", unit: "km", index: 1.5, limit: "Bez omezení", max: null },
    { key: "cross-country", label: "Běžky", category: "Zimní sporty", unit: "km", index: 1.4, limit: "Bez omezení", max: null },
    { key: "snowboard", label: "Snowboard", category: "Zimní sporty", unit: "km", index: 1.5, limit: "Bez omezení", max: null },
    { key: "ski-tour", label: "Skialpy", category: "Zimní sporty", unit: "km", index: 1.8, limit: "Bez omezení", max: null },
    { key: "ice-skates", label: "Bruslení", category: "Zimní sporty", unit: "min", index: 0.16, limit: "Max 180 min na zápis", max: 180 },
    { key: "winter-hiking", label: "Zimní turistika", category: "Zimní sporty", unit: "km", index: 1.2, limit: "Bez omezení", max: null },
    { key: "low-workout", label: "Cvičení - nízká intenzita", category: "Cvičení a regenerace", unit: "min", index: 0.12, limit: "Max 180 min na zápis", max: 180 },
    { key: "mid-workout", label: "Cvičení - střední intenzita", category: "Cvičení a regenerace", unit: "min", index: 0.18, limit: "Max 180 min na zápis", max: 180 },
    { key: "high-workout", label: "Cvičení - vysoká intenzita", category: "Cvičení a regenerace", unit: "min", index: 0.24, limit: "Max 180 min na zápis", max: 180 },
    { key: "wellness", label: "Wellness", category: "Wellness a kultura", unit: "návštěva", index: 6, limit: "1 návštěva = 6 bodů", max: 1 },
    { key: "theatre", label: "Divadlo", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "cinema", label: "Kino", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "concert", label: "Koncert", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "exhibition", label: "Výstava", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 návštěva = 8 bodů", max: 1 },
    { key: "book", label: "Kniha", category: "Wellness a kultura", unit: "návštěva", index: 8, limit: "1 dokončená kniha = 8 bodů", max: 1 },
    { key: "cold-water", label: "Otužování", category: "Wellness a kultura", unit: "vstup", index: 4, limit: "1 vstup = 4 body", max: 1 }
  ]
};

const state = {
  sessionUserId: null,
  selectedChallengeId: "summer-2026",
  currentView: "overview",
  adminSelectedParticipantId: null,
  accessChoices: {},
  catalogOverrides: {},
  weeklyBonuses: {
    "summer-2026": {
      weekLabel: "17. - 23. března 2026",
      activityType: "run",
      bonusPoints: 12,
      note: "Za každý první běh v týdnu získáš jednorázový bonus navíc."
    },
    "winter-2025": {
      weekLabel: "Archivní bonus",
      activityType: "cross-country",
      bonusPoints: 10,
      note: "Historický přehled bonusové aktivity z uzavřené výzvy."
    }
  },
  users: [
    { id: "u1", name: "Tereza Martinovská", role: "participant", avatar: "TM", color: "#0f766e", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" },
    { id: "u2", name: "Petr Novák", role: "participant", avatar: "PN", color: "#2563eb", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" },
    { id: "u3", name: "Jana Králová", role: "admin", avatar: "JK", color: "#b45309", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" },
    { id: "u4", name: "Lucie Dvořáková", role: "participant", avatar: "LD", color: "#7c3aed", photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80" },
    { id: "u5", name: "Martin Svoboda", role: "participant", avatar: "MS", color: "#dc2626", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80" },
    { id: "u6", name: "Eva Procházková", role: "participant", avatar: "EP", color: "#0891b2", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" },
    { id: "u7", name: "David Kučera", role: "participant", avatar: "DK", color: "#16a34a", photo: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=200&q=80" },
    { id: "u8", name: "Klára Benešová", role: "participant", avatar: "KB", color: "#ea580c", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" }
  ],
  challenges: [
    {
      id: "summer-2026",
      title: "Letní výzva 2026",
      type: "summer",
      state: "active",
      start: "2026-03-01",
      end: "2026-04-15",
      rules: "Aktivity lze zapisovat pouze v rámci trvání výzvy. Nepovolené aktivity nejsou dostupné.",
      participantIds: ["u2", "u3", "u4", "u5", "u6", "u7", "u8"]
    },
    {
      id: "winter-2025",
      title: "Zimní výzva 2025",
      type: "winter",
      state: "archived",
      start: "2025-01-10",
      end: "2025-02-28",
      rules: "Historická výzva je pouze pro čtení.",
      participantIds: ["u1", "u2", "u3"]
    }
  ],
  activities: [
    {
      id: "a1",
      challengeId: "summer-2026",
      userId: "u2",
      type: "run",
      value: 8,
      date: "2026-03-08",
      createdAt: "2026-03-08 18:10",
      createdBy: "u2"
    },
    {
      id: "a2",
      challengeId: "summer-2026",
      userId: "u3",
      type: "team-sport",
      value: 90,
      date: "2026-03-09",
      createdAt: "2026-03-09 20:10",
      createdBy: "u3"
    },
    {
      id: "a5",
      challengeId: "summer-2026",
      userId: "u4",
      type: "swim",
      value: 2.4,
      date: "2026-03-10",
      createdAt: "2026-03-10 07:35",
      createdBy: "u4"
    },
    {
      id: "a6",
      challengeId: "summer-2026",
      userId: "u4",
      type: "hiking",
      value: 11,
      date: "2026-03-11",
      createdAt: "2026-03-11 19:20",
      createdBy: "u4"
    },
    {
      id: "a7",
      challengeId: "summer-2026",
      userId: "u5",
      type: "road-bike",
      value: 24,
      date: "2026-03-11",
      createdAt: "2026-03-11 18:40",
      createdBy: "u5"
    },
    {
      id: "a8",
      challengeId: "summer-2026",
      userId: "u5",
      type: "concert",
      value: 1,
      date: "2026-03-09",
      createdAt: "2026-03-09 21:10",
      createdBy: "u5"
    },
    {
      id: "a9",
      challengeId: "summer-2026",
      userId: "u6",
      type: "dance",
      value: 80,
      date: "2026-03-10",
      createdAt: "2026-03-10 18:00",
      createdBy: "u6"
    },
    {
      id: "a10",
      challengeId: "summer-2026",
      userId: "u6",
      type: "wellness",
      value: 1,
      date: "2026-03-12",
      createdAt: "2026-03-12 20:10",
      createdBy: "u6"
    },
    {
      id: "a11",
      challengeId: "summer-2026",
      userId: "u7",
      type: "run",
      value: 14,
      date: "2026-03-12",
      createdAt: "2026-03-12 06:55",
      createdBy: "u7"
    },
    {
      id: "a12",
      challengeId: "summer-2026",
      userId: "u7",
      type: "team-sport",
      value: 120,
      date: "2026-03-08",
      createdAt: "2026-03-08 19:30",
      createdBy: "u7"
    },
    {
      id: "a13",
      challengeId: "summer-2026",
      userId: "u8",
      type: "book",
      value: 1,
      date: "2026-03-07",
      createdAt: "2026-03-07 20:15",
      createdBy: "u8"
    },
    {
      id: "a14",
      challengeId: "summer-2026",
      userId: "u8",
      type: "mid-workout",
      value: 75,
      date: "2026-03-11",
      createdAt: "2026-03-11 07:10",
      createdBy: "u8"
    },
    {
      id: "a3",
      challengeId: "winter-2025",
      userId: "u1",
      type: "ski",
      value: 12,
      date: "2025-02-01",
      createdAt: "2025-02-01 16:40",
      createdBy: "u1"
    },
    {
      id: "a4",
      challengeId: "winter-2025",
      userId: "u2",
      type: "wellness",
      value: 1,
      date: "2025-02-10",
      createdAt: "2025-02-10 19:10",
      createdBy: "u3"
    }
  ],
  auditLog: [
    {
      id: "l1",
      challengeId: "summer-2026",
      actorId: "u3",
      message: "Admin upravil katalog aktivit pro letní výzvu",
      createdAt: "2026-03-01 09:00"
    },
    {
      id: "l2",
      challengeId: "winter-2025",
      actorId: "u3",
      message: "Historická data byla importována a uzamčena",
      createdAt: "2025-03-01 10:30"
    }
  ]
};

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const sessionPanel = document.querySelector("#sessionPanel");
const viewTabs = document.querySelector("#viewTabs");
const decisionPage = document.querySelector("#decisionPage");
const overviewPage = document.querySelector("#overviewPage");
const personalPage = document.querySelector("#personalPage");
const adminPage = document.querySelector("#adminPage");
const challengeList = document.querySelector("#challengeList");
const challengeDetail = document.querySelector("#challengeDetail");
const leaderboard = document.querySelector("#leaderboard");
const recentActivities = document.querySelector("#recentActivities");
const auditLog = document.querySelector("#auditLog");

function getUser(userId) {
  return state.users.find((user) => user.id === userId);
}

function createAvatarMarkup(user, sizeClass = "") {
  const className = ["avatar", sizeClass].filter(Boolean).join(" ");
  if (user.photo) {
    return `<span class="${className} avatar-photo-shell" style="background:${user.color}"><img class="avatar-photo" src="${user.photo}" alt="${user.name}" /></span>`;
  }

  return `<span class="${className}" style="background:${user.color}">${user.avatar}</span>`;
}

function getChallenge(challengeId) {
  return state.challenges.find((challenge) => challenge.id === challengeId);
}

function getCatalog(challenge) {
  return state.catalogOverrides[challenge.id] ?? activityCatalog[challenge.type];
}

function getActivityConfig(challenge, activityType) {
  return getCatalog(challenge).find((item) => item.key === activityType);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(dateString));
}

function daysRemaining(endDate) {
  const end = new Date(endDate);
  const current = new Date(today);
  const diff = Math.ceil((end - current) / (1000 * 60 * 60 * 24));
  return diff < 0 ? 0 : diff;
}

function calculatePoints(challenge, activity) {
  const config = getActivityConfig(challenge, activity.type);
  return Math.round(activity.value * config.index * 10) / 10;
}

function isParticipant(challengeId, userId) {
  return getChallenge(challengeId).participantIds.includes(userId);
}

function getChallengeActivities(challengeId) {
  return state.activities.filter((activity) => activity.challengeId === challengeId);
}

function isAdmin(userId = state.sessionUserId) {
  return getUser(userId)?.role === "admin";
}

function getLeaderboard(challengeId) {
  const challenge = getChallenge(challengeId);
  return challenge.participantIds
    .map((userId) => {
      const user = getUser(userId);
      const points = getChallengeActivities(challengeId)
        .filter((activity) => activity.userId === userId)
        .reduce((sum, activity) => sum + calculatePoints(challenge, activity), 0);

      return { user, points: Math.round(points * 10) / 10 };
    })
    .sort((a, b) => b.points - a.points);
}

function getUserChallengeActivities(challengeId, userId) {
  return getChallengeActivities(challengeId).filter((activity) => activity.userId === userId);
}

function createBadge(label, variant = "") {
  return `<span class="badge ${variant}">${label}</span>`;
}

function getStateLabel(challengeState) {
  return challengeState === "active" ? "Aktivní" : "Archiv";
}

function getUnitLabel(unit) {
  if (unit === "km") return "km";
  if (unit === "min") return "min";
  if (unit === "návštěva") return "počet návštěv";
  if (unit === "vstup") return "počet vstupů";
  return unit;
}

function getActivityEmoji(activityKey) {
  const emojiMap = {
    "road-bike": "🚴",
    mtb: "🚵",
    "inline-skates": "🛼",
    hiking: "🥾",
    "mountain-hiking": "⛰️",
    climbing: "🧗",
    "water-sports": "🌊",
    run: "🏃",
    swim: "🏊",
    "team-sport": "🏅",
    "low-workout": "🧘",
    "mid-workout": "💪",
    "high-workout": "🔥",
    dance: "💃",
    wellness: "🧖",
    theatre: "🎭",
    cinema: "🎬",
    concert: "🎵",
    exhibition: "🖼️",
    book: "📚",
    "downhill-ski": "🎿",
    "cross-country": "🎿",
    snowboard: "🏂",
    "ski-tour": "🏔️",
    "ice-skates": "⛸️",
    "winter-hiking": "❄️",
    "cold-water": "🥶"
  };

  return emojiMap[activityKey] || "";
}

function getActivityEmoji(activityKey) {
  const emojiMap = {
    "road-bike": "🚴",
    mtb: "🚵",
    "inline-skates": "🛼",
    hiking: "🥾",
    "mountain-hiking": "⛰️",
    climbing: "🧗",
    "water-sports": "🌊",
    run: "🏃",
    swim: "🏊",
    "team-sport": "🏅",
    "low-workout": "🧘",
    "mid-workout": "💪",
    "high-workout": "🔥",
    dance: "💃",
    wellness: "🧖",
    theatre: "🎭",
    cinema: "🎬",
    concert: "🎵",
    exhibition: "🖼️",
    book: "📚",
    "downhill-ski": "🎿",
    "cross-country": "🎿",
    snowboard: "🏂",
    "ski-tour": "🏔️",
    "ice-skates": "⛸️",
    "winter-hiking": "❄️",
    "cold-water": "🥶"
  };

  return emojiMap[activityKey] || "";
}

function groupCatalogItems(challenge) {
  return getCatalog(challenge).reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {});
}

function splitCatalogColumns(challenge) {
  return getCatalog(challenge).reduce(
    (columns, item) => {
      const isCulture = item.category.toLowerCase().includes("kultura") || item.key === "book";
      if (isCulture) {
        columns.culture.push(item);
      } else {
        columns.sport.push(item);
      }
      return columns;
    },
    { sport: [], culture: [] }
  );
}

function getAccessChoiceKey(userId, challengeId) {
  return `${userId}:${challengeId}`;
}

function getAccessChoice(userId, challengeId) {
  return state.accessChoices[getAccessChoiceKey(userId, challengeId)] ?? null;
}

function requiresAccessDecision() {
  if (!state.sessionUserId) {
    return false;
  }

  const challenge = getChallenge(state.selectedChallengeId);
  if (!challenge || challenge.state !== "active") {
    return false;
  }

  if (isParticipant(challenge.id, state.sessionUserId)) {
    return false;
  }

  return !getAccessChoice(state.sessionUserId, challenge.id);
}

function getWeeklyBonus(challengeId) {
  return state.weeklyBonuses[challengeId] ?? null;
}

function getDashboardMetrics(challengeId, userId) {
  const challenge = getChallenge(challengeId);
  const leaderboardRows = getLeaderboard(challengeId);
  const joined = isParticipant(challenge.id, userId);
  const personalRank = leaderboardRows.findIndex((entry) => entry.user.id === userId) + 1;
  const personalPoints = leaderboardRows.find((entry) => entry.user.id === userId)?.points ?? 0;
  const personalMedal = getMedalForRank(personalRank);
  const userActivities = getUserChallengeActivities(challenge.id, userId)
    .sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));
  const chartMax = Math.max(...leaderboardRows.map((entry) => entry.points), 1);

  return {
    challenge,
    joined,
    leaderboardRows,
    personalRank,
    personalPoints,
    personalMedal,
    userActivities,
    chartMax
  };
}

function getAdminSelectedParticipant(challengeId) {
  const challenge = getChallenge(challengeId);
  if (!challenge || !state.adminSelectedParticipantId) {
    return null;
  }

  if (!challenge.participantIds.includes(state.adminSelectedParticipantId)) {
    return null;
  }

  return getUser(state.adminSelectedParticipantId);
}

function getMedalForRank(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function renderViewTabs() {
  if (!state.sessionUserId || requiresAccessDecision()) {
    viewTabs.innerHTML = "";
    return;
  }

  const challenge = getChallenge(state.selectedChallengeId);
  const canAccessPersonalDashboard = isParticipant(challenge.id, state.sessionUserId);
  const adminUser = isAdmin();
  const tabs = [
    { id: "overview", label: "Přehled výzvy" },
    ...(adminUser ? [{ id: "admin", label: "Administrace" }] : []),
    ...(canAccessPersonalDashboard ? [{ id: "personal", label: adminUser ? "Můj pohled" : "Můj dashboard" }] : [])
  ];

  if (!canAccessPersonalDashboard && state.currentView === "personal") {
    state.currentView = adminUser ? "admin" : "overview";
  }

  if (!adminUser && state.currentView === "admin") {
    state.currentView = "overview";
  }

  viewTabs.innerHTML = tabs
    .map(
      (tab) =>
        `<button class="tab-button ${state.currentView === tab.id ? "active" : "secondary"}" data-view="${tab.id}">${tab.label}</button>`
    )
    .join("");

  viewTabs.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      render();
    });
  });
}

function renderAuth() {
  if (state.sessionUserId) {
    authView.innerHTML = "";
    appView.classList.remove("hidden");
    return;
  }

  appView.classList.add("hidden");
  authView.innerHTML = `
    <div class="auth-card">
      <p class="eyebrow">Krok 0</p>
      <h2>Sign in with Slack</h2>
      <p class="muted">Prototyp používá simulované firemní přihlášení do jednoho Slack workspace.</p>
      <form id="loginForm">
        <label>
          Uživatel
          <select name="userId">
            ${state.users
              .map(
                (user) =>
                  `<option value="${user.id}" ${user.role === "admin" ? "selected" : ""}>${user.name} (${user.role})</option>`
              )
              .join("")}
          </select>
        </label>
        <button type="submit">Přihlásit přes Slack</button>
      </form>
    </div>
  `;

  document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get("userId"));
    state.sessionUserId = userId;
    state.currentView = isAdmin(userId) ? "admin" : "overview";
    render();
  });
}

function renderSession() {
  if (!state.sessionUserId) {
    sessionPanel.innerHTML = "";
    return;
  }

  const user = getUser(state.sessionUserId);
  const canAccessPersonalDashboard = isParticipant(state.selectedChallengeId, state.sessionUserId);
  const adminUser = isAdmin();
  sessionPanel.innerHTML = `
    <div class="profile-menu">
      <button class="profile-trigger" id="profileMenuButton" type="button" aria-haspopup="true" aria-expanded="false">
        ${createAvatarMarkup(user)}
        <span class="profile-meta">
          <strong>${user.name}</strong>
          <span class="profile-role">${user.role === "admin" ? "Administrátor" : "Účastník"}</span>
        </span>
        <span class="profile-chevron">▾</span>
      </button>
      <div class="profile-dropdown hidden" id="profileDropdown">
        ${
          adminUser
            ? `<button class="profile-action secondary" id="adminViewButton" type="button">Administrace</button>`
            : ""
        }
        <button class="profile-action secondary" id="dashboardButton" type="button" ${canAccessPersonalDashboard ? "" : "disabled"}>
          ${adminUser ? "Můj účastnický pohled" : "Můj dashboard"}
        </button>
        <button class="profile-action secondary" id="logoutButton" type="button">Odhlásit</button>
      </div>
    </div>
  `;

  const profileMenuButton = document.querySelector("#profileMenuButton");
  const profileDropdown = document.querySelector("#profileDropdown");
  const adminViewButton = document.querySelector("#adminViewButton");
  const dashboardButton = document.querySelector("#dashboardButton");
  const logoutButton = document.querySelector("#logoutButton");

  const closeMenu = () => {
    profileDropdown.classList.add("hidden");
    profileMenuButton.setAttribute("aria-expanded", "false");
  };

  profileMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isHidden = profileDropdown.classList.contains("hidden");
    profileDropdown.classList.toggle("hidden", !isHidden);
    profileMenuButton.setAttribute("aria-expanded", isHidden ? "true" : "false");
  });

  adminViewButton?.addEventListener("click", () => {
    state.currentView = "admin";
    closeMenu();
    render();
  });

  dashboardButton?.addEventListener("click", () => {
    if (!canAccessPersonalDashboard) {
      return;
    }

    state.currentView = "personal";
    closeMenu();
    render();
  });

  logoutButton.addEventListener("click", () => {
    state.sessionUserId = null;
    state.currentView = "overview";
    closeMenu();
    render();
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!sessionPanel.contains(event.target)) {
        closeMenu();
      }
    },
    { once: true }
  );
}

function renderDecisionPage() {
  if (!state.sessionUserId || !requiresAccessDecision()) {
    decisionPage.innerHTML = "";
    return;
  }

  const challenge = getChallenge(state.selectedChallengeId);
  const user = getUser(state.sessionUserId);

  decisionPage.innerHTML = `
    <section class="decision-step">
      <div class="decision-hero">
        <p class="eyebrow">Krok 1</p>
        <h2>Jak chceš pokračovat po přihlášení?</h2>
        <p class="muted">
          ${user.name}, právě ses přihlásil(a) přes Slack do ${challenge.title}. Vyber si, jestli se chceš do výzvy aktivně zapojit,
          nebo si ji zatím jen projít v režimu náhledu.
        </p>
      </div>

      <div class="decision-options">
        <button class="decision-card decision-card-primary" id="joinDecisionButton" type="button">
          <span class="decision-icon">🏅</span>
          <span class="decision-copy">
            <strong>Zapojit se do výzvy</strong>
            <span>Odemkneš si dashboard, osobní cíle, zapisování aktivit a plné zapojení do pořadí.</span>
          </span>
        </button>

        <button class="decision-card decision-card-secondary" id="viewerDecisionButton" type="button">
          <span class="decision-icon">👁️</span>
          <span class="decision-copy">
            <strong>Pouze náhled výzvy</strong>
            <span>Zůstaneš v režimu prohlížení. Uvidíš přehled, pravidla i leaderboard, ale bez vlastního dashboardu.</span>
          </span>
        </button>
      </div>
    </section>
  `;

  document.querySelector("#joinDecisionButton").addEventListener("click", () => {
    challenge.participantIds.push(user.id);
    state.accessChoices[getAccessChoiceKey(user.id, challenge.id)] = "participant";
    state.auditLog.unshift({
      id: crypto.randomUUID(),
      challengeId: challenge.id,
      actorId: user.id,
      message: `${user.name} se připojil(a) do aktivní výzvy`,
      createdAt: `${today} 12:00`
    });
    state.currentView = "overview";
    render();
  });

  document.querySelector("#viewerDecisionButton").addEventListener("click", () => {
    state.accessChoices[getAccessChoiceKey(user.id, challenge.id)] = "viewer";
    state.currentView = "overview";
    render();
  });
}

function renderChallengeList() {
  const archivedChallenges = state.challenges.filter((challenge) => challenge.state !== "active");

  challengeList.innerHTML = `
    <section class="challenge-section challenge-section-archive">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Historie</p>
          <h3>Archiv výzev</h3>
        </div>
        <p class="muted">Starší výzvy jsou pouze pro čtení.</p>
      </div>
      ${
        archivedChallenges.length
          ? `
            <button class="archive-link-card" id="openArchiveButton" type="button">
              <span class="archive-link-icon">🗂️</span>
              <span class="archive-link-copy">
                <strong>Otevřít archiv výzev</strong>
                <span>Máš k dispozici ${archivedChallenges.length} historick${archivedChallenges.length === 1 ? "ou výzvu" : "é výzvy"} pro zpětný náhled a kontrolu výsledků.</span>
              </span>
              <span class="archive-link-arrow">→</span>
            </button>
          `
          : `<div class="empty-state">Zatím tu není žádná historická výzva.</div>`
      }
    </section>
  `;

  challengeList.querySelectorAll("[data-challenge-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedChallengeId = button.dataset.challengeId;
      render();
    });
  });

  document.querySelector("#openArchiveButton")?.addEventListener("click", () => {
    state.selectedChallengeId = archivedChallenges[0].id;
    render();
    document.querySelector("#challengeDetail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderChallengeDetail() {
  const challenge = getChallenge(state.selectedChallengeId);
  const currentUser = getUser(state.sessionUserId);
  const joined = isParticipant(challenge.id, currentUser.id);
  const isAdmin = currentUser.role === "admin";
  const weeklyBonus = getWeeklyBonus(challenge.id);
  const scoringRules = getCatalog(challenge)
    .map(
      (item) => `
        <p><strong>${getActivityEmoji(item.key)} ${item.label}</strong>: zadává se v jednotce ${item.unit} a počítá se s indexem ${item.index}.</p>
      `
    )
    .join("");
  const catalogColumns = splitCatalogColumns(challenge);
  challengeDetail.innerHTML = `
    <div class="hero-banner">
      <div class="badge-row">
        ${createBadge(challenge.state === "active" ? "Aktuální výzva" : "Historická výzva")}
        ${createBadge(joined ? "Přihlášen do výzvy" : "Jen náhled", joined ? "" : "warning")}
      </div>
      <h2>${challenge.title}</h2>
      <p class="muted">${challenge.rules}</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-label">Období</span>
          <strong>${formatDate(challenge.start)} - ${formatDate(challenge.end)}</strong>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-label">Do konce</span>
          <strong>${daysRemaining(challenge.end)} dní</strong>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-label">Stav</span>
          <strong>${getStateLabel(challenge.state)}</strong>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-label">Účastníci</span>
          <strong>${challenge.participantIds.length}</strong>
        </div>
      </div>
    </div>

    <div class="rule-box weekly-bonus-box weekly-bonus-box-wide">
      <div class="weekly-bonus-header">
        <div>
          <p class="eyebrow">Bonus pro tento týden</p>
          <h3>${weeklyBonus ? `${getActivityEmoji(weeklyBonus.activityType)} ${getActivityConfig(challenge, weeklyBonus.activityType)?.label ?? weeklyBonus.activityType}` : "Týdenní bonus není nastaven"}</h3>
        </div>
        ${weeklyBonus ? `<span class="bonus-pill">+${weeklyBonus.bonusPoints} bodů</span>` : ""}
      </div>

      ${
        weeklyBonus
          ? `
            <div class="bonus-summary">
              <p><strong>Platnost:</strong> ${weeklyBonus.weekLabel}</p>
              <p>${weeklyBonus.note}</p>
            </div>
          `
          : `<div class="empty-state">Admin zatím nenastavil žádnou bonusovou aktivitu na tento týden.</div>`
      }

      ${
        isAdmin
          ? `
            <form id="weeklyBonusForm" class="weekly-bonus-form">
              <label>
                Týden
                <input type="text" name="weekLabel" value="${weeklyBonus?.weekLabel ?? ""}" placeholder="Např. 17. - 23. března 2026" required />
              </label>
              <label>
                Bonusová aktivita
                <select name="activityType" required>
                  ${getCatalog(challenge)
                    .map(
                      (item) =>
                        `<option value="${item.key}" ${weeklyBonus?.activityType === item.key ? "selected" : ""}>${getActivityEmoji(item.key)} ${item.label}</option>`
                    )
                    .join("")}
                </select>
              </label>
              <label>
                Bonusové body
                <input type="number" name="bonusPoints" min="1" step="1" value="${weeklyBonus?.bonusPoints ?? 10}" required />
              </label>
              <label>
                Popis bonusu
                <input type="text" name="note" value="${weeklyBonus?.note ?? ""}" placeholder="Např. První splnění v týdnu přidá extra body." required />
              </label>
              <button type="submit">Uložit bonus týdne</button>
            </form>
          `
          : ""
      }
    </div>

    <div class="rule-box activity-catalog activity-catalog-wide">
      <h3>Katalog aktivit</h3>
      <div class="catalog-columns">
        <div class="catalog-group">
          <div class="catalog-group-header">
            <h4>Sportovní aktivity</h4>
            <span class="muted">${catalogColumns.sport.length} aktivit</span>
          </div>
          <div class="catalog-cards">
            ${catalogColumns.sport
              .map(
                (item) => `
                  <div class="catalog-card">
                    <div class="catalog-card-top">
                      <p><strong>${getActivityEmoji(item.key)} ${item.label}</strong></p>
                      <span class="catalog-unit">${getUnitLabel(item.unit)}</span>
                    </div>
                    <span class="catalog-limit">${item.limit}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="catalog-group">
          <div class="catalog-group-header">
            <h4>Kultura</h4>
            <span class="muted">${catalogColumns.culture.length} aktivit</span>
          </div>
          <div class="catalog-cards">
            ${catalogColumns.culture
              .map(
                (item) => `
                  <div class="catalog-card">
                    <div class="catalog-card-top">
                      <p><strong>${getActivityEmoji(item.key)} ${item.label}</strong></p>
                      <span class="catalog-unit">${getUnitLabel(item.unit)}</span>
                    </div>
                    <span class="catalog-limit">${item.limit}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="rule-box rule-box-text">
      <h3>Obecná pravidla</h3>
      <div class="rules-copy">
        <p>Aktuální výzva je hlavní pracovní plocha pro zapojení účastníků a zapisování aktivit. Archiv slouží jen pro zpětné nahlížení.</p>
        <p>Aktivitu lze zapsat pouze v době trvání aktivní výzvy. Historické výzvy jsou pouze pro čtení a výsledky v nich zůstávají uzamčené.</p>
        <p>Body se počítají jako zadaná hodnota násobená indexem dané aktivity. U každého zápisu proto vždy vidíš i vysvětlení výpočtu.</p>
        ${scoringRules}
      </div>
    </div>
  `;

  bindPersonalActions();
}

function renderRecentActivities() {
  const challenge = getChallenge(state.selectedChallengeId);
  const items = getChallengeActivities(challenge.id)
    .sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`))
    .slice(0, 5)
    .map((activity) => {
      const user = getUser(activity.userId);
      const config = getActivityConfig(challenge, activity.type);
      const points = calculatePoints(challenge, activity);
      return `
        <div class="activity-row activity-row-compact">
          <div>
            <p><strong>${user.name}</strong> · ${getActivityEmoji(activity.type)} ${config.label}</p>
            <p class="explanation">${activity.value} ${config.unit} · ${formatDate(activity.date)}</p>
          </div>
          <span class="points">${points} b</span>
        </div>
      `;
    })
    .join("");

  recentActivities.innerHTML = items || `<div class="empty-state">Zatím neexistuje žádný zápis.</div>`;
}

function renderAdminPage() {
  const challenge = getChallenge(state.selectedChallengeId);
  const currentUser = getUser(state.sessionUserId);
  const challengeActivities = getChallengeActivities(challenge.id);
  const leaderboardRows = getLeaderboard(challenge.id);
  const totalPoints = leaderboardRows.reduce((sum, entry) => sum + entry.points, 0);
  const latestActivities = [...challengeActivities].sort(
    (a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`)
  );
  const participants = leaderboardRows.map((entry, index) => {
    const records = getUserChallengeActivities(challenge.id, entry.user.id).length;
    return { ...entry, rank: index + 1, records };
  });
  const catalog = getCatalog(challenge);
  const selectedParticipant = getAdminSelectedParticipant(challenge.id);
  const selectedMetrics = selectedParticipant ? getDashboardMetrics(challenge.id, selectedParticipant.id) : null;
  const selectedActivities = selectedParticipant
    ? getUserChallengeActivities(challenge.id, selectedParticipant.id).sort(
        (a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`)
      )
    : [];

  adminPage.innerHTML = `
    <section class="dashboard-page admin-page">
      <div class="dashboard-hero admin-hero">
        <div class="personal-card-header">
          <div class="inline-row">
            ${createAvatarMarkup(currentUser, "avatar-large")}
            <div>
              <p class="eyebrow">Administrátorský pohled</p>
              <h2>${challenge.title}</h2>
              <p class="muted">Správa účastníků, zápisů a bonusů pro aktuální výzvu.</p>
            </div>
          </div>
          <div class="badge-row">
            ${createBadge("Admin workspace")}
            ${createBadge(`${challenge.participantIds.length} účastníků`, challenge.type === "summer" ? "summer" : "winter")}
          </div>
        </div>

        <div class="dashboard-stats">
          <div class="dashboard-stat dashboard-stat-primary">
            <span class="personal-stat-label">Účastníci</span>
            <strong>${challenge.participantIds.length}</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Zápisy</span>
            <strong>${challengeActivities.length}</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Body celkem</span>
            <strong>${Math.round(totalPoints * 10) / 10} b</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Auditní záznamy</span>
            <strong>${state.auditLog.filter((entry) => entry.challengeId === challenge.id).length}</strong>
          </div>
        </div>
      </div>

      <div class="admin-grid">
        <div class="score-card personal-card">
          <h3>Rychlý admin zápis za účastníka</h3>
          <form id="adminActivityForm">
            <label>
              Účastník
              <select name="userId" required>
                ${challenge.participantIds
                  .map((userId) => {
                    const user = getUser(userId);
                    return `<option value="${user.id}" ${selectedParticipant?.id === user.id ? "selected" : ""}>${user.name}</option>`;
                  })
                  .join("")}
              </select>
            </label>
            <label>
              Datum aktivity
              <input type="date" name="date" min="${challenge.start}" max="${challenge.end}" value="${today}" required />
            </label>
            <label>
              Typ aktivity
              <select name="type" id="adminActivityTypeSelect" required>
                ${getCatalog(challenge)
                  .map(
                    (item) =>
                      `<option value="${item.key}" data-unit-label="${getUnitLabel(item.unit)}">${getActivityEmoji(item.key)} ${item.label} (${getUnitLabel(item.unit)})</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label id="adminActivityValueLabel">
              Hodnota (${getUnitLabel(getCatalog(challenge)[0].unit)})
              <input type="number" step="0.1" min="0.1" name="value" value="5" required />
            </label>
            <button type="submit">Zapsat aktivitu jako admin</button>
          </form>
        </div>

        <div class="score-card personal-card">
          <h3>Účastníci a výkon</h3>
          <div class="admin-participant-grid">
            ${participants
              .map(
                (entry) => `
                  <button class="admin-participant-card admin-participant-button ${selectedParticipant?.id === entry.user.id ? "active" : ""}" type="button" data-admin-participant-id="${entry.user.id}">
                    <div class="admin-participant-header">
                      <div class="inline-row">
                        ${createAvatarMarkup(entry.user)}
                        <div>
                          <p><strong>${entry.user.name}</strong></p>
                          <p class="explanation">${entry.user.role === "admin" ? "Administrátor" : "Účastník"}</p>
                        </div>
                      </div>
                      <span class="badge">#${entry.rank}</span>
                    </div>
                    <div class="admin-participant-stats">
                      <div><span class="muted">Body</span><strong>${entry.points} b</strong></div>
                      <div><span class="muted">Zápisy</span><strong>${entry.records}</strong></div>
                    </div>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="score-card dashboard-wide personal-card">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Krok 2</p>
              <h3>${selectedParticipant ? `Detail účastníka: ${selectedParticipant.name}` : "Vyber účastníka"}</h3>
            </div>
            <p class="muted">${selectedParticipant ? "Tady admin vidí osobní přehled a všechny zápisy vybraného účastníka." : "Nejdřív klikni na účastníka nahoře. Potom se otevře detail s možností upravovat všechny jeho zápisy."}</p>
          </div>
          ${
            selectedParticipant && selectedMetrics
              ? `
                <div class="admin-detail-shell">
                  <div class="admin-detail-toolbar">
                    <button class="secondary" type="button" id="adminBackToParticipants">Zpět na seznam účastníků</button>
                  </div>

                  <div class="admin-dashboard-card">
                    <div class="admin-dashboard-top">
                      <div class="inline-row">
                        ${createAvatarMarkup(selectedParticipant)}
                        <div>
                          <p><strong>${selectedParticipant.name}</strong></p>
                          <p class="explanation">${selectedParticipant.role === "admin" ? "Administrátor" : "Účastník"}</p>
                        </div>
                      </div>
                      <span class="badge">${selectedMetrics.personalMedal ? `${selectedMetrics.personalMedal} ` : ""}#${selectedMetrics.personalRank || "-"}</span>
                    </div>
                    <div class="admin-dashboard-stats admin-dashboard-stats-compact">
                      <div><span class="muted">Body</span><strong>${selectedMetrics.personalPoints} b</strong></div>
                      <div><span class="muted">Zápisy</span><strong>${selectedMetrics.userActivities.length}</strong></div>
                    </div>
                  </div>

                  <div class="admin-record-list">
                    ${
                      selectedActivities.length
                        ? selectedActivities
                            .map((activity) => {
                              const config = getActivityConfig(challenge, activity.type);
                              return `
                                <div class="admin-record-row">
                                  <div class="admin-record-main">
                                    ${createAvatarMarkup(selectedParticipant)}
                                    <div>
                                      <p><strong>${selectedParticipant.name}</strong> · ${getActivityEmoji(activity.type)} ${config.label}</p>
                                      <p class="explanation">${activity.value} ${config.unit} · ${formatDate(activity.date)} · ${calculatePoints(challenge, activity)} bodů</p>
                                    </div>
                                  </div>
                                  <form class="admin-record-form" data-activity-id="${activity.id}">
                                    <label>
                                      Datum
                                      <input type="date" name="date" min="${challenge.start}" max="${challenge.end}" value="${activity.date}" required />
                                    </label>
                                    <label>
                                      Aktivita
                                      <select name="type">
                                        ${catalog
                                          .map(
                                            (item) =>
                                              `<option value="${item.key}" ${item.key === activity.type ? "selected" : ""}>${getActivityEmoji(item.key)} ${item.label}</option>`
                                          )
                                          .join("")}
                                      </select>
                                    </label>
                                    <label>
                                      Hodnota
                                      <input type="number" step="0.1" min="0.1" name="value" value="${activity.value}" required />
                                    </label>
                                    <input type="hidden" name="userId" value="${selectedParticipant.id}" />
                                    <div class="button-row admin-record-actions">
                                      <button type="submit">Uložit změny</button>
                                      <button class="secondary admin-delete-button" type="button" data-activity-id="${activity.id}">Smazat</button>
                                    </div>
                                  </form>
                                </div>
                              `;
                            })
                            .join("")
                        : `<div class="empty-state">Vybraný účastník zatím nemá žádné zápisy.</div>`
                    }
                  </div>

                  <div class="admin-detail-actions">
                    <button type="button" id="adminAddActivityForParticipant">Přidat aktivitu</button>
                  </div>
                </div>
              `
              : `<div class="empty-state">Vyber účastníka ze seznamu. Po otevření detailu uvidíš všechny jeho zápisy a můžeš je upravovat.</div>`
          }
        </div>

        <div class="score-card dashboard-wide personal-card">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Nastavení výzvy</p>
              <h3>Pravidla a katalog aktivit</h3>
            </div>
            <p class="muted">Změny se okamžitě propsají do detailu výzvy i formulářů.</p>
          </div>

          <form id="challengeRulesForm">
            <label>
              Pravidla výzvy
              <textarea name="rules" rows="3">${challenge.rules}</textarea>
            </label>
            <button type="submit">Uložit pravidla</button>
          </form>

          <div class="admin-catalog-editor">
            ${catalog
              .map(
                (item) => `
                  <form class="admin-catalog-form" data-activity-key="${item.key}">
                    <div class="admin-catalog-header">
                      <div>
                        <p><strong>${getActivityEmoji(item.key)} ${item.label}</strong></p>
                        <p class="explanation">${item.key}</p>
                      </div>
                      <span class="badge">${item.category}</span>
                    </div>
                    <div class="admin-catalog-grid">
                      <label>
                        Název
                        <input type="text" name="label" value="${item.label}" required />
                      </label>
                      <label>
                        Kategorie
                        <input type="text" name="category" value="${item.category}" required />
                      </label>
                      <label>
                        Jednotka
                        <select name="unit">
                          ${["km", "min", "návštěva", "vstup"].map((unit) => `<option value="${unit}" ${unit === item.unit ? "selected" : ""}>${unit}</option>`).join("")}
                        </select>
                      </label>
                      <label>
                        Index
                        <input type="number" step="0.01" min="0" name="index" value="${item.index}" required />
                      </label>
                      <label>
                        Limit text
                        <input type="text" name="limit" value="${item.limit}" required />
                      </label>
                      <label>
                        Max hodnota
                        <input type="number" step="0.1" min="0" name="max" value="${item.max ?? ""}" placeholder="Bez omezení" />
                      </label>
                    </div>
                    <div class="button-row admin-catalog-actions">
                      <button type="submit">Uložit aktivitu</button>
                      <button class="secondary admin-catalog-delete-button" type="button" data-activity-key="${item.key}">Smazat aktivitu</button>
                    </div>
                  </form>
                `
              )
              .join("")}
          </div>

          <form id="adminCatalogCreateForm" class="admin-catalog-form admin-catalog-create-form">
            <div class="admin-catalog-header">
              <div>
                <p><strong>Přidat novou aktivitu</strong></p>
                <p class="explanation">Nová položka se okamžitě objeví v katalogu i ve formulářích pro zapisování aktivit.</p>
              </div>
              <span class="badge">Nová položka</span>
            </div>
            <div class="admin-catalog-grid">
              <label>
                Klíč aktivity
                <input type="text" name="key" placeholder="napr. yoga-class" required />
              </label>
              <label>
                Název
                <input type="text" name="label" placeholder="Např. Jóga" required />
              </label>
              <label>
                Kategorie
                <input type="text" name="category" placeholder="Např. Sportovní aktivity" required />
              </label>
              <label>
                Jednotka
                <select name="unit">
                  ${["km", "min", "návštěva", "vstup"].map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
                </select>
              </label>
              <label>
                Index
                <input type="number" step="0.01" min="0" name="index" value="1" required />
              </label>
              <label>
                Limit text
                <input type="text" name="limit" placeholder="Např. Bez omezení" required />
              </label>
              <label>
                Max hodnota
                <input type="number" step="0.1" min="0" name="max" placeholder="Bez omezení" />
              </label>
            </div>
            <div class="button-row admin-catalog-actions">
              <button type="submit">Přidat aktivitu</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  bindAdminActions();
}

function renderPersonalPage() {
  const currentUser = getUser(state.sessionUserId);
  const { challenge, joined, leaderboardRows, personalRank, personalPoints, personalMedal, userActivities, chartMax } =
    getDashboardMetrics(state.selectedChallengeId, currentUser.id);

  const personalActivityItems = userActivities
    .map((activity) => {
      const config = getActivityConfig(challenge, activity.type);
      const points = calculatePoints(challenge, activity);
      return `
        <div class="activity-row personal-activity-row">
          <div>
            <p><strong>${getActivityEmoji(activity.type)} ${config.label}</strong></p>
            <p class="explanation">${activity.value} ${config.unit} · ${formatDate(activity.date)}</p>
          </div>
          <span class="points">${points} b</span>
        </div>
      `;
    })
    .join("");

  personalPage.innerHTML = `
    <section class="dashboard-page">
      <div class="dashboard-hero">
        <div class="personal-card-header">
          <div class="inline-row">
            <span class="avatar avatar-large" style="background:${currentUser.color}">${currentUser.avatar}</span>
            <div>
              <p class="eyebrow">Můj dashboard</p>
              <h2>${currentUser.name}</h2>
              <p class="muted">Osobní přehled pro ${challenge.title}</p>
            </div>
          </div>
          <div class="badge-row">
            ${createBadge(challenge.title, challenge.type === "summer" ? "summer" : "winter")}
            ${createBadge(joined ? "Aktivní účastník" : "Pouze sleduje", joined ? "" : "warning")}
          </div>
        </div>

        <div class="dashboard-stats">
          <div class="dashboard-stat dashboard-stat-primary">
            <span class="personal-stat-label">Moje body</span>
            <strong>${personalPoints} b</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Pořadí</span>
            <strong>${personalRank ? `${personalMedal} #${personalRank}`.trim() : "-"}</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Moje zápisy</span>
            <strong>${userActivities.length}</strong>
          </div>
          <div class="dashboard-stat">
            <span class="personal-stat-label">Konec výzvy</span>
            <strong>${formatDate(challenge.end)}</strong>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="score-card personal-card activity-panel">
          <h3>Moje zadání do výzvy</h3>
          ${
            challenge.state !== "active"
              ? `<div class="empty-state">Archiv je pouze pro čtení. Do historické výzvy už nelze nic přidat.</div>`
              : !joined
                ? `
                  <div class="empty-state">Nejprve se přihlas do aktivní výzvy. Potom se ti zpřístupní osobní formulář pro zápis aktivit.</div>
                  <div class="button-row">
                    <button id="joinChallengeButton">Přihlásit se do výzvy</button>
                  </div>
                `
                : `
                  <form id="activityForm">
                    <label>
                      Datum aktivity
                      <input type="date" name="date" min="${challenge.start}" max="${challenge.end}" value="${today}" required />
                    </label>
                    <label>
                      Typ aktivity
                      <select name="type" id="activityTypeSelect">
                        ${getCatalog(challenge)
                          .map(
                            (item) =>
                              `<option value="${item.key}" data-unit-label="${getUnitLabel(item.unit)}">${getActivityEmoji(item.key)} ${item.label} (${getUnitLabel(item.unit)})</option>`
                          )
                          .join("")}
                      </select>
                    </label>
                    <label id="activityValueLabel">
                      Hodnota (${getUnitLabel(getCatalog(challenge)[0].unit)})
                      <input type="number" step="0.1" min="0.1" name="value" value="5" required />
                    </label>
                    <button type="submit">Uložit aktivitu</button>
                  </form>
                `
          }
        </div>

        <div class="score-card chart-panel">
          <h3>Jak si vedeš vůči ostatním</h3>
          <div class="chart-list">
            ${leaderboardRows
              .map((entry) => {
                const isCurrentUser = entry.user.id === currentUser.id;
                return `
                  <div class="chart-row ${isCurrentUser ? "current-user" : ""}">
                    <div class="chart-label">
                      <span class="avatar" style="background:${entry.user.color}">${entry.user.avatar}</span>
                      <div>
                        <p><strong>${entry.user.name}</strong></p>
                        <p class="explanation">${entry.points} bodů</p>
                      </div>
                    </div>
                    <div class="chart-bar-track">
                      <div class="chart-bar" style="width:${(entry.points / chartMax) * 100}%"></div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="score-card dashboard-wide records-panel">
          <h3>Moje zápisy</h3>
          ${
            personalActivityItems ||
            `<div class="empty-state">Zatím tu nemáš žádný vlastní zápis pro tuto výzvu.</div>`
          }
        </div>
      </div>
    </section>
  `;

  bindPersonalActions();
}

function bindPersonalActions() {
  const challenge = getChallenge(state.selectedChallengeId);
  const currentUser = getUser(state.sessionUserId);
  const joinButton = document.querySelector("#joinChallengeButton");
  if (joinButton) {
    joinButton.addEventListener("click", () => {
      challenge.participantIds.push(currentUser.id);
      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} se připojil(a) do aktivní výzvy`,
        createdAt: `${today} 12:00`
      });
      render();
    });
  }

  const activityForm = document.querySelector("#activityForm");
  if (activityForm) {
    const activityTypeSelect = document.querySelector("#activityTypeSelect");
    const activityValueLabel = document.querySelector("#activityValueLabel");

    const syncValueLabel = () => {
      const selectedOption = activityTypeSelect.options[activityTypeSelect.selectedIndex];
      activityValueLabel.childNodes[0].textContent = `Hodnota (${selectedOption.dataset.unitLabel})`;
    };

    activityTypeSelect.addEventListener("change", syncValueLabel);
    syncValueLabel();

    activityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const type = formData.get("type");
      const value = Number(formData.get("value"));
      const date = formData.get("date");
      const config = getActivityConfig(challenge, type);

      if (date < challenge.start || date > challenge.end) {
        window.alert("Datum musí být v rámci trvání výzvy.");
        return;
      }

      if (config.max && value > config.max) {
        window.alert(`Pro aktivitu ${config.label} je maximální hodnota ${config.max} ${config.unit}.`);
        return;
      }

      const activity = {
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        userId: currentUser.id,
        type,
        value,
        date,
        createdAt: `${today} 12:00`,
        createdBy: currentUser.id
      };

      const points = calculatePoints(challenge, activity);
      state.activities.unshift(activity);
      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} zapsal(a) ${config.label}: ${value} ${config.unit} = ${points} bodů`,
        createdAt: `${today} 12:00`
      });

      render();
    });
  }

  const weeklyBonusForm = document.querySelector("#weeklyBonusForm");
  if (weeklyBonusForm) {
    weeklyBonusForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const activityType = String(formData.get("activityType"));
      const bonusPoints = Number(formData.get("bonusPoints"));
      const weekLabel = String(formData.get("weekLabel")).trim();
      const note = String(formData.get("note")).trim();
      const activityConfig = getActivityConfig(challenge, activityType);

      state.weeklyBonuses[challenge.id] = {
        activityType,
        bonusPoints,
        weekLabel,
        note
      };

      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} nastavil(a) bonus týdne: ${activityConfig.label} za +${bonusPoints} bodů`,
        createdAt: `${today} 12:00`
      });

      render();
    });
  }
}

function bindAdminActions() {
  const challenge = getChallenge(state.selectedChallengeId);
  const currentUser = getUser(state.sessionUserId);
  const adminActivityForm = document.querySelector("#adminActivityForm");
  const challengeRulesForm = document.querySelector("#challengeRulesForm");
  const adminCatalogCreateForm = document.querySelector("#adminCatalogCreateForm");
  const addActivityForParticipantButton = document.querySelector("#adminAddActivityForParticipant");

  document.querySelectorAll("[data-admin-participant-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminSelectedParticipantId = button.dataset.adminParticipantId;
      render();
    });
  });

  document.querySelector("#adminBackToParticipants")?.addEventListener("click", () => {
    state.adminSelectedParticipantId = null;
    render();
  });

  addActivityForParticipantButton?.addEventListener("click", () => {
    const participant = getAdminSelectedParticipant(challenge.id);
    if (!participant || !adminActivityForm) {
      return;
    }

    const userSelect = adminActivityForm.querySelector('select[name="userId"]');
    if (userSelect) {
      userSelect.value = participant.id;
    }

    adminActivityForm.scrollIntoView({ behavior: "smooth", block: "start" });
    adminActivityForm.querySelector('input[name="date"]')?.focus();
  });

  if (adminActivityForm) {
    const activityTypeSelect = document.querySelector("#adminActivityTypeSelect");
    const activityValueLabel = document.querySelector("#adminActivityValueLabel");

    const syncValueLabel = () => {
      const selectedOption = activityTypeSelect.options[activityTypeSelect.selectedIndex];
      activityValueLabel.childNodes[0].textContent = `Hodnota (${selectedOption.dataset.unitLabel})`;
    };

    activityTypeSelect.addEventListener("change", syncValueLabel);
    syncValueLabel();

    adminActivityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const type = String(formData.get("type"));
      const value = Number(formData.get("value"));
      const date = String(formData.get("date"));
      const userId = String(formData.get("userId"));
      const participant = getUser(userId);
      const config = getActivityConfig(challenge, type);

      if (date < challenge.start || date > challenge.end) {
        window.alert("Datum musí být v rámci trvání výzvy.");
        return;
      }

      if (config.max && value > config.max) {
        window.alert(`Pro aktivitu ${config.label} je maximální hodnota ${config.max} ${config.unit}.`);
        return;
      }

      const activity = {
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        userId,
        type,
        value,
        date,
        createdAt: `${today} 12:00`,
        createdBy: currentUser.id
      };

      state.activities.unshift(activity);
      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} přidal(a) zápis za ${participant.name}: ${config.label} (${value} ${config.unit})`,
        createdAt: `${today} 12:00`
      });

      render();
    });
  }

  challengeRulesForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const rules = String(new FormData(event.currentTarget).get("rules")).trim();
    challenge.rules = rules;
    state.auditLog.unshift({
      id: crypto.randomUUID(),
      challengeId: challenge.id,
      actorId: currentUser.id,
      message: `${currentUser.name} upravil(a) pravidla výzvy`,
      createdAt: `${today} 12:00`
    });
    render();
  });

  document.querySelectorAll(".admin-catalog-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const activityKey = event.currentTarget.dataset.activityKey;
      const currentCatalog = getCatalog(challenge).map((item) => ({ ...item }));
      const itemIndex = currentCatalog.findIndex((item) => item.key === activityKey);
      if (itemIndex === -1) {
        return;
      }

      currentCatalog[itemIndex] = {
        ...currentCatalog[itemIndex],
        label: String(formData.get("label")).trim(),
        category: String(formData.get("category")).trim(),
        unit: String(formData.get("unit")),
        index: Number(formData.get("index")),
        limit: String(formData.get("limit")).trim(),
        max: formData.get("max") === "" ? null : Number(formData.get("max"))
      };

      state.catalogOverrides[challenge.id] = currentCatalog;
      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} upravil(a) katalogovou položku ${currentCatalog[itemIndex].label}`,
        createdAt: `${today} 12:00`
      });
      render();
    });
  });

  adminCatalogCreateForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentCatalog = getCatalog(challenge).map((item) => ({ ...item }));
    const key = String(formData.get("key")).trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(key)) {
      window.alert("Klíč aktivity může obsahovat jen malá písmena, čísla a pomlčky.");
      return;
    }

    if (currentCatalog.some((item) => item.key === key)) {
      window.alert("Aktivita s tímto klíčem už v katalogu existuje.");
      return;
    }

    const newItem = {
      key,
      label: String(formData.get("label")).trim(),
      category: String(formData.get("category")).trim(),
      unit: String(formData.get("unit")),
      index: Number(formData.get("index")),
      limit: String(formData.get("limit")).trim(),
      max: formData.get("max") === "" ? null : Number(formData.get("max"))
    };

    state.catalogOverrides[challenge.id] = [...currentCatalog, newItem];
    state.auditLog.unshift({
      id: crypto.randomUUID(),
      challengeId: challenge.id,
      actorId: currentUser.id,
      message: `${currentUser.name} přidal(a) katalogovou položku ${newItem.label}`,
      createdAt: `${today} 12:00`
    });
    render();
  });

  document.querySelectorAll(".admin-catalog-delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const activityKey = button.dataset.activityKey;
      const currentCatalog = getCatalog(challenge).map((item) => ({ ...item }));
      const itemToDelete = currentCatalog.find((item) => item.key === activityKey);

      if (!itemToDelete) {
        return;
      }

      const hasExistingRecords = getChallengeActivities(challenge.id).some((activity) => activity.type === activityKey);
      if (hasExistingRecords) {
        window.alert("Tuto aktivitu nelze smazat, protože už má ve výzvě existující zápisy.");
        return;
      }

      state.catalogOverrides[challenge.id] = currentCatalog.filter((item) => item.key !== activityKey);
      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} smazal(a) katalogovou položku ${itemToDelete.label}`,
        createdAt: `${today} 12:00`
      });
      render();
    });
  });

  document.querySelectorAll(".admin-record-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const activityId = event.currentTarget.dataset.activityId;
      const activity = state.activities.find((item) => item.id === activityId);
      if (!activity) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const type = String(formData.get("type"));
      const value = Number(formData.get("value"));
      const date = String(formData.get("date"));
      const userId = String(formData.get("userId"));
      const config = getActivityConfig(challenge, type);

      if (date < challenge.start || date > challenge.end) {
        window.alert("Datum musí být v rámci trvání výzvy.");
        return;
      }

      if (config.max && value > config.max) {
        window.alert(`Pro aktivitu ${config.label} je maximální hodnota ${config.max} ${config.unit}.`);
        return;
      }

      activity.userId = userId;
      activity.type = type;
      activity.value = value;
      activity.date = date;
      activity.createdBy = currentUser.id;

      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} upravil(a) zápis ${activityId} uživatele ${getUser(userId).name} na ${config.label} (${value} ${config.unit})`,
        createdAt: `${today} 12:00`
      });

      render();
    });
  });

  document.querySelectorAll(".admin-delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.activityId;
      const activityIndex = state.activities.findIndex((activity) => activity.id === activityId);
      if (activityIndex === -1) {
        return;
      }

      const [removedActivity] = state.activities.splice(activityIndex, 1);
      const activityOwner = getUser(removedActivity.userId);
      const config = getActivityConfig(challenge, removedActivity.type);

      state.auditLog.unshift({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        actorId: currentUser.id,
        message: `${currentUser.name} smazal(a) zápis uživatele ${activityOwner.name}: ${config.label} (${removedActivity.value} ${config.unit})`,
        createdAt: `${today} 12:00`
      });

      render();
    });
  });
}

function renderLeaderboard() {
  const rows = getLeaderboard(state.selectedChallengeId);

  leaderboard.innerHTML = rows.length
    ? rows
        .map(
          (entry, index) => `
            <div class="leaderboard-row">
              <div class="leaderboard-main">
                <span class="leaderboard-rank">${getMedalForRank(index + 1) || `#${index + 1}`}</span>
                <span class="avatar" style="background:${entry.user.color}">${entry.user.avatar}</span>
                <div>
                  <p><strong>${entry.user.name}</strong></p>
                  <p class="muted">${entry.user.role === "admin" ? "Administrátor" : "Účastník"}</p>
                </div>
              </div>
              <span class="points">${entry.points} b</span>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">Ve výzvě zatím nejsou žádní účastníci.</div>`;
}

function renderAuditLog() {
  const selectedChallengeAudit = state.auditLog
    .filter((entry) => entry.challengeId === state.selectedChallengeId)
    .slice(0, 8);

  auditLog.innerHTML = selectedChallengeAudit.length
    ? selectedChallengeAudit
        .map((entry) => {
          const actor = getUser(entry.actorId);
          return `
            <div class="log-row">
              <div class="log-main">
                <span class="avatar" style="background:${actor.color}">${actor.avatar}</span>
                <div>
                  <p><strong>${actor.name}</strong></p>
                  <p class="explanation">${entry.message}</p>
                </div>
              </div>
              <span class="muted">${entry.createdAt}</span>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">Pro tuto výzvu zatím není auditní záznam.</div>`;
}

function render() {
  renderAuth();
  renderSession();
  renderDecisionPage();
  renderViewTabs();

  if (!state.sessionUserId) {
    return;
  }

  const blockedByDecision = requiresAccessDecision();
  const canAccessPersonalDashboard = isParticipant(state.selectedChallengeId, state.sessionUserId);
  const adminUser = isAdmin();
  const isOverview = state.currentView === "overview";
  const isAdminView = state.currentView === "admin";
  decisionPage.classList.toggle("hidden", !blockedByDecision);
  overviewPage.classList.toggle("hidden", blockedByDecision || !isOverview);
  personalPage.classList.toggle("hidden", blockedByDecision || isOverview || isAdminView || !canAccessPersonalDashboard);
  adminPage.classList.toggle("hidden", blockedByDecision || !isAdminView || !adminUser);
  document.querySelector(".panel-side").classList.toggle("hidden", blockedByDecision || !isOverview);
  document.querySelector(".panel-main").classList.toggle("panel-main-full", blockedByDecision || !isOverview);

  if (isOverview) {
    renderChallengeList();
    renderChallengeDetail();
    renderLeaderboard();
    renderRecentActivities();
    renderAuditLog();
  } else if (isAdminView && adminUser) {
    renderAdminPage();
  } else if (canAccessPersonalDashboard) {
    renderPersonalPage();
  }
}

render();
