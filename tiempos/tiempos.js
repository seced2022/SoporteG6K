import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAapHF_VxFyA0DkLd4ylt_M6RiR2s6mspI",
  authDomain: "heidegger-tiempos.firebaseapp.com",
  databaseURL: "https://heidegger-tiempos-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "heidegger-tiempos",
  storageBucket: "heidegger-tiempos.firebasestorage.app",
  messagingSenderId: "358686549642",
  appId: "1:358686549642:web:d927c0696b60f24f802f73"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const state = { data: null, view: "general" };

const els = {
  eventName: document.querySelector("#eventName"),
  eventMeta: document.querySelector("#eventMeta"),
  stageName: document.querySelector("#stageName"),
  lastUpdate: document.querySelector("#lastUpdate"),
  liveBadge: document.querySelector("#liveBadge"),
  resultType: document.querySelector("#resultType"),
  viewTitle: document.querySelector("#viewTitle"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  resultsBody: document.querySelector("#resultsBody"),
  notice: document.querySelector("#notice")
};

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function list(value) {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : value && typeof value === "object"
      ? Object.values(value)
      : [];
}

function participantFor(dorsal) {
  return state.data?.participantes?.[String(dorsal)] || {};
}

function enrich(row) {
  const participant = participantFor(row.dorsal);
  return { ...participant, ...row };
}

function renderRows(rows) {
  const enriched = rows.map(enrich).sort((a, b) => (Number(a.posicion) || 9999) - (Number(b.posicion) || 9999));
  if (!enriched.length) {
    els.resultsBody.innerHTML = '<tr><td colspan="6" class="empty">Todavía no hay resultados publicados en esta sección.</td></tr>';
    return;
  }

  els.resultsBody.innerHTML = enriched.map((row, index) => `<tr>
    <td class="position">${esc(row.posicion ?? index + 1)}</td>
    <td>
      <span class="bib">${esc(row.dorsal ?? "—")}</span>
      <span class="driver">${esc(row.piloto ?? row.equipo ?? "Participante")}</span>
      <span class="codriver">${esc(row.copiloto ?? "")}</span>
    </td>
    <td>${esc(row.vehiculo ?? "—")}<span class="vehicle-sub">${esc(row.grupo ?? "")}</span></td>
    <td>${esc(row.clase ?? "—")}</td>
    <td class="right time">${esc(row.tiempo ?? row.tiempoTotal ?? row.total ?? "—")}</td>
    <td class="right gap">${esc(row.diferencia || "—")}</td>
  </tr>`).join("");
}

function rowsForView(data, view) {
  if (view === "general") return list(data.clasificacionGeneral);
  if (view === "stage") return list(data.ultimoTramo?.resultados);
  if (view === "classes") return list(data.clasificacionClases);
  if (view === "retired") {
    return list(data.participantes)
      .filter(p => String(p.estado || "").toLowerCase() === "retirado")
      .map((p, i) => ({ ...p, posicion: "—", tiempo: "RETIRADO", diferencia: "", _orden: i }));
  }
  return [];
}

function render() {
  const data = state.data;
  if (!data) return;

  const cfg = data.configuracion || {};
  els.eventName.textContent = cfg.nombreEvento || "Tiempos online";
  els.eventMeta.textContent = [cfg.fecha, cfg.ubicacion].filter(Boolean).join(" · ") || "Rally";
  els.stageName.textContent = state.view === "stage"
    ? (data.ultimoTramo?.nombre || cfg.tramoActual || "Último tramo")
    : (cfg.tramoActual || "Clasificación del rally");
  els.lastUpdate.textContent = cfg.ultimaActualizacion || "—";

  const status = String(cfg.estado || "SIN PUBLICAR").toUpperCase();
  const live = ["EN DIRECTO", "EN CURSO"].includes(status);
  els.liveBadge.textContent = status;
  els.liveBadge.className = `badge ${live ? "badge-live" : "badge-off"}`;
  els.resultType.textContent = String(cfg.tipoResultados || "PROVISIONALES").toUpperCase();
  els.notice.textContent = cfg.mensaje || "";
  els.notice.classList.toggle("hidden", !cfg.mensaje);

  const titles = {
    general: ["CLASIFICACIÓN", "General"],
    stage: ["TRAMO", data.ultimoTramo?.nombre || "Último tramo"],
    classes: ["CLASIFICACIÓN", "Por clases"],
    retired: ["INCIDENCIAS", "Retirados"]
  };
  [els.viewEyebrow.textContent, els.viewTitle.textContent] = titles[state.view];
  renderRows(rowsForView(data, state.view));
}

document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(item => item.classList.toggle("active", item === button));
  state.view = button.dataset.view;
  render();
}));

onValue(ref(db, "publicacion"), snapshot => {
  state.data = snapshot.val();
  if (!state.data) {
    els.liveBadge.textContent = "SIN PUBLICAR";
    els.lastUpdate.textContent = "—";
    renderRows([]);
    return;
  }
  render();
}, error => {
  console.error(error);
  els.notice.textContent = "No se ha podido conectar con el servidor de tiempos.";
  els.notice.classList.remove("hidden");
});
