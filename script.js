// -----------------------------
// Script principal - Parque Tecnológico das Escolas
// Projeto Firebase: aparelhos-tecnologicos
// -----------------------------
console.log("Script carregado! Navegação ativada!");

// Imports do Firestore (v11 modules)
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// DB exposto globalmente no index.html
const db = window.db;

// 🔥 Nome da coleção no Firestore
const collectionName = "aparelhos_tecnologicos";

// -----------------------------
// Referências da UI
// -----------------------------
const paginas = document.querySelectorAll(".pagina");
const menuLinks = document.querySelectorAll("nav a");
const form = document.getElementById("formCadastro");
const tabelaConsultaBody = document.querySelector("#tabelaConsulta tbody");
const tabelaClassificacaoBody = document.querySelector("#tabelaClassificacao tbody");
const pesquisaConsulta = document.getElementById("pesquisaConsulta");
const pesquisaClassificacao = document.getElementById("pesquisaClassificacao");
const btnExportar = document.getElementById("btnExportar");
const toasts = document.getElementById("toasts");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const editingIdInput = document.getElementById("editingId");

// -----------------------------
// Navegação entre páginas
// -----------------------------
menuLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const alvo = e.currentTarget.id.replace("menu", "pagina");

    paginas.forEach(p => p.classList.remove("ativa"));
    document.getElementById(alvo).classList.add("ativa");

    menuLinks.forEach(l => l.classList.remove("active"));
    e.currentTarget.classList.add("active");

    if (alvo === "paginaConsulta") carregarConsulta();
    if (alvo === "paginaClassificacao") carregarClassificacao();
  });
});
// -----------------------------
// Botão "Acessar o Sistema"
// -----------------------------
const btnAcessarSistema = document.getElementById("btnAcessarSistema");
if (btnAcessarSistema) {
  btnAcessarSistema.addEventListener("click", () => {
    // Oculta todas as páginas
    paginas.forEach(p => p.classList.remove("ativa"));
    // Mostra a página de cadastro
    document.getElementById("paginaCadastro").classList.add("ativa");

    // Atualiza o menu ativo
    menuLinks.forEach(l => l.classList.remove("active"));
    document.getElementById("menuCadastro").classList.add("active");
  });
}


// -----------------------------
// Toasts simples
// -----------------------------
function toast(msg, tipo = "default") {
  const t = document.createElement("div");
  t.className = `toast ${tipo === "success" ? "success" : tipo === "error" ? "error" : ""}`;
  t.textContent = msg;
  toasts.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// -----------------------------
// Salvar novo cadastro ou atualizar existente
// -----------------------------
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  // Converter valores numéricos
  data.roteadores = data.roteadores ? Number(data.roteadores) : 0;
  data.switchs = data.switchs ? Number(data.switchs) : 0;
  data.leitores = data.leitores ? Number(data.leitores) : 0;

  const editingId = editingIdInput.value;
  try {
    if (editingId) {
      // Atualizar documento existente
      const docRef = doc(db, collectionName, editingId);
      await updateDoc(docRef, data);
      toast("✅ Cadastro atualizado.", "success");
      btnCancelarEdicao.classList.add("hide");
      editingIdInput.value = "";
      document.getElementById("btnSalvar").textContent = "Salvar Cadastro";
    } else {
      // Novo documento
      await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      toast("✅ Escola cadastrada com sucesso!", "success");
    }
    form.reset();
    carregarConsulta();
    carregarClassificacao();
  } catch (err) {
    console.error(err);
    toast("❌ Erro ao salvar: " + (err.message || err), "error");
  }
});

// Cancelar edição
btnCancelarEdicao.addEventListener("click", () => {
  form.reset();
  editingIdInput.value = "";
  btnCancelarEdicao.classList.add("hide");
  document.getElementById("btnSalvar").textContent = "Salvar Cadastro";
});

// -----------------------------
// Carregar tabela de consulta
// -----------------------------
// -----------------------------
// Carregar tabela de consulta (com contadores)
// -----------------------------
async function carregarConsulta() {
  tabelaConsultaBody.innerHTML = "";

  // Elementos de contagem (caso o usuário esteja em outra aba)
  const totalEscolasEl = document.getElementById("totalEscolas");
  const totalPendentesEl = document.getElementById("totalPendentes");

  let totalEscolas = 0;
  let totalPendentes = 0;

  try {
    const q = query(collection(db, collectionName), orderBy("nomeEscola"));
    const snap = await getDocs(q);

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;

      totalEscolas++;
      if (d.status === "Pendente") totalPendentes++;

      const tr = document.createElement("tr");

      const corClass =
        d.status === "Pendente" ? "status-red" :
        d.status === "Resolvido" || d.status === "Sem pendência" ? "status-green" : "";

      const createdAt = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : "";

      tr.innerHTML = `
        <td>${d.nomeEscola || ""}</td>
        <td>${d.roteadores ?? ""}</td>
        <td>${d.switchs ?? ""}</td>
        <td>${d.leitores ?? ""}</td>
        <td>${d.provedor || ""}</td>
        <td>${d.medidor || ""}</td>
        <td style="max-width:240px;white-space:pre-wrap">${d.solicitacao || ""}</td>
        <td class="${corClass}">${d.status || ""}</td>
        <td>${createdAt}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${id}">Editar</button>
          <button class="action-btn" data-action="delete" data-id="${id}">Excluir</button>
        </td>
      `;
      tabelaConsultaBody.appendChild(tr);
    });

    // Atualiza os contadores no topo da aba
    if (totalEscolasEl) totalEscolasEl.textContent = totalEscolas;
    if (totalPendentesEl) totalPendentesEl.textContent = totalPendentes;

  } catch (err) {
    console.error(err);
    toast("❌ Erro ao carregar dados.", "error");
  }
}


// -----------------------------
// Carregar tabela de classificação
// -----------------------------
async function carregarClassificacao() {
  tabelaClassificacaoBody.innerHTML = "";
  try {
    const q = query(collection(db, collectionName), orderBy("status"));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const tr = document.createElement("tr");
      const corClass =
        d.status === "Pendente" ? "status-red" :
        d.status === "Resolvido" || d.status === "Sem pendência" ? "status-green" : "";

      tr.innerHTML = `
        <td>${d.nomeEscola || ""}</td>
        <td style="max-width:360px;white-space:pre-wrap">${d.solicitacao || ""}</td>
        <td class="${corClass}">${d.status || ""}</td>
      `;
      tabelaClassificacaoBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    toast("❌ Erro ao carregar classificação.", "error");
  }
}

// -----------------------------
// Ações editar/excluir
// -----------------------------
document.querySelector("#tabelaConsulta tbody").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action || !id) return;

  if (action === "edit") {
    // Preencher form com dados do documento
    try {
      const snap = await getDocs(query(collection(db, collectionName)));
      let found = null;
      snap.forEach(s => { if (s.id === id) found = { id: s.id, data: s.data() }; });
      if (!found) { toast("Documento não encontrado.", "error"); return; }
      const d = found.data;
      form.nomeEscola.value = d.nomeEscola || "";
      form.roteadores.value = d.roteadores ?? "";
      form.switchs.value = d.switchs ?? "";
      form.leitores.value = d.leitores ?? "";
      form.provedor.value = d.provedor || "";
      form.medidor.value = d.medidor || "";
      form.solicitacao.value = d.solicitacao || "";
      form.status.value = d.status || "";
      editingIdInput.value = id;
      document.getElementById("btnSalvar").textContent = "Atualizar Cadastro";
      btnCancelarEdicao.classList.remove("hide");
      document.getElementById("menuCadastro").click();
    } catch (err) {
      console.error(err);
      toast("❌ Erro ao iniciar edição.", "error");
    }
  } else if (action === "delete") {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast("🗑️ Registro excluído.", "success");
      carregarConsulta();
      carregarClassificacao();
    } catch (err) {
      console.error(err);
      toast("❌ Erro ao excluir: " + (err.message || err), "error");
    }
  }
});

// -----------------------------
// Pesquisa nas tabelas
// -----------------------------
pesquisaConsulta.addEventListener("input", (e) => {
  const termo = e.target.value.toLowerCase();
  document.querySelectorAll("#tabelaConsulta tbody tr").forEach(linha => {
    linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
});

pesquisaClassificacao.addEventListener("input", (e) => {
  const termo = e.target.value.toLowerCase();
  document.querySelectorAll("#tabelaClassificacao tbody tr").forEach(linha => {
    linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
});

// -----------------------------
// Exportar PDF
// -----------------------------
btnExportar.addEventListener("click", () => {
  const linhas = Array.from(document.querySelectorAll("#tabelaConsulta tbody tr"))
    .filter(tr => tr.style.display !== "none");

  if (!linhas.length) { toast("Nenhum registro para exportar.", "error"); return; }

  const dados = linhas.map(tr => {
    const cols = tr.querySelectorAll("td");
    return [
      cols[0].innerText,
      cols[1].innerText,
      cols[2].innerText,
      cols[3].innerText,
      cols[4].innerText,
      cols[5].innerText,
      cols[6].innerText,
      cols[7].innerText,
      cols[8].innerText
    ];
  });

  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF({ orientation: "landscape" });
  const hoje = new Date().toLocaleString();

  docPDF.setFontSize(14);
  docPDF.text("Relatório - Parque Tecnológico das Escolas", 14, 14);
  docPDF.setFontSize(10);
  docPDF.text(`Gerado em: ${hoje}`, 14, 22);

  docPDF.autoTable({
    startY: 28,
    head: [[
      "Escola","Roteadores","Switchs","Leitores","Provedor","Medidor","Solicitação","Status","Data"
    ]],
    body: dados,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [240,240,240] },
    theme: "grid"
  });

  docPDF.save(`relatorio_aparelhos_tecnologicos_${Date.now()}.pdf`);
  toast("✅ PDF gerado.", "success");
});

// -----------------------------
// Inicialização
// -----------------------------
carregarConsulta();
carregarClassificacao();


