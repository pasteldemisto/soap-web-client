// ========================== ESTADO GLOBAL ===========================
let registros = [];
let registrosPorData = {};
let responsaveis = [];
import { API_URL } from './config.js';

const servicos = {
  "Limpeza Banheiros": "Realizar limpeza completa dos banheiros.",
  "Reposição de Materiais": "Verificar e repor materiais de limpeza.",
  "Limpeza de Janelas": "Limpar todas as janelas do andar.",
  "Verificação de Estoque": "Checar níveis de estoque e registrar necessidades.",
  "Limpeza Corredores": "Varrição e lavagem de corredores."
};

const blocos = [
  "Bloco A", "Bloco B", "Bloco C", "Bloco D", "Bloco E", "Bloco F",
  "Bloco H", "Bloco I", "Bloco J", "Bloco K", "Bloco M", "Bloco N",
  "Bloco O", "Bloco P", "Bloco Q", "Bloco R", "Bloco T", "Bloco Z"
];

let indiceAtual = 0;
let dataAtual = "";

// ========================== BUSCA DE DADOS ============================
await buscarRegistros();
await buscarFuncionarios();

async function buscarRegistros() {
  try {
    const res = await fetch(`${API_URL}/api/tarefas/listarTarefas`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!res.ok) {
      return console.error('Erro ao buscar tarefas:', await res.json());
    }
    
    const dados = await res.json();

    registros = dados.map(tarefa => {
      const dataObj = new Date(tarefa.data);
      return {
        id: tarefa._id,
        nome: tarefa.nome,
        descricao: tarefa.descricao,
        bloco: tarefa.bloco,
        data: dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        hora: tarefa.horario,
        status: tarefa.status,
        idFuncionario: tarefa.idFuncionario,
        nomeFuncionario: tarefa.nomeFuncionario
      };
    });

    registrosPorData = registros.reduce((acc, r) => {
      acc[r.data] = acc[r.data] || [];
      acc[r.data].push(r);
      return acc;
    }, {});
    
    // Mantém apenas os últimos 7 dias, mesmo que não haja registros e que haja registros futuros
    const diasValidos = obterUltimosSeteDias();
    const registrosFiltrados = {};
    diasValidos.forEach(data => {
      registrosFiltrados[data] = registrosPorData[data] || [];
    });
    
    registrosPorData = registrosFiltrados;
    
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
  }
}

async function buscarFuncionarios() {
  try {
    const res = await fetch(`${API_URL}/api/funcionarios/listarFuncionarios`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) return console.error('Erro ao buscar funcionários:', await res.json());

    const funcionarios = await res.json();
    responsaveis = funcionarios.map(f => ({
      _id: f._id,
      nome: f.nome,
      matricula: f.matricula,
      cargo: f.cargo,
      email: f.email
    }));

  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
  }
}

// ========================== DOM ELEMENTOS =============================
const colunaHistorico = document.getElementById("coluna-historico");
const painelVisualizacao = document.getElementById("visualizacao-tarefa");
const painelAdicionar = document.getElementById("formulario-adicionar");

const [inputNome, inputHorario, inputBloco] = painelVisualizacao.querySelectorAll("input");
const textareaDescricao = painelVisualizacao.querySelector("textarea");
const tituloTarefa = document.getElementById("titulo-tarefa");

const selectServico = document.getElementById("select-servico");
const selectResponsavel = document.getElementById("select-responsavel");
const selectBloco = document.getElementById("select-bloco");
const inputHorarioNovo = document.getElementById("input-horario");
const textareaNovaDescricao = document.getElementById("textarea-descricao");
const formAdicionar = document.getElementById("form-adicionar");

const btnRemover = document.getElementById("botao-remover");
const confirmacaoRemocao = document.getElementById("confirmacao-remocao");
const btnConfirmarSim = document.getElementById("btn-confirmar-sim");
const btnConfirmarNao = document.getElementById("btn-confirmar-nao");

// =========================== RENDER HISTÓRICO =========================
function renderHistorico() {
  colunaHistorico.innerHTML = "";
  const datasOrdenadas = Object.keys(registrosPorData).sort(
    (a, b) => new Date(b.split("/").reverse().join("-")) - new Date(a.split("/").reverse().join("-"))
  );

  datasOrdenadas.forEach(data => {
    const sec = document.createElement("div");
    sec.className = "date-section card";

    const header = document.createElement("div");
    header.className = "date-header";
    header.textContent = data;
    sec.appendChild(header);

    const lista = document.createElement("div");
    lista.className = "p-2";

    registrosPorData[data].forEach((pessoa, index) => {
      const card = document.createElement("div");
      card.className = "schedule-card d-flex justify-content-between align-items-center";
      card.dataset.index = index;
      card.dataset.data = data;
      card.innerHTML = `
        <div class="fw-bold text-primary">${pessoa.hora}</div>
        <div class="text-center flex-fill px-2">${pessoa.nome}</div>
        <div class="text-end text-muted">${pessoa.bloco}</div>
      `;
      card.addEventListener("click", () => {
        preencherFormulario(data, index);
        painelVisualizacao.classList.remove("d-none");
        painelAdicionar.classList.add("d-none");
      });
      lista.appendChild(card);
    });

    sec.appendChild(lista);

    colunaHistorico.appendChild(sec);
  });
}

function preencherFormulario(data, index) {
  const p = registrosPorData[data][index];
  dataAtual = data;
  indiceAtual = index;
  inputNome.value = p.nomeFuncionario;
  inputHorario.value = p.hora;
  inputBloco.value = p.bloco;
  textareaDescricao.value = p.descricao;
  tituloTarefa.textContent = p.nome;
}

// ============================ OBTER ÚLTIMOS 7 DIAS ============================

function obterUltimosSeteDias(){
  const dias = [];
  const hoje = new Date();
  for (let i = 0; i < 7; i++) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - i);
    dias.push(dia.toLocaleDateString('pt-BR'));
  }
  return dias;
}

// ============================ FORMULÁRIO ==============================
function popularSelects() {
  selectServico.innerHTML = Object.keys(servicos).map(s => `<option value="${s}">${s}</option>`).join("");
  selectResponsavel.innerHTML = responsaveis.map(r => `<option value="${r.nome}">${r.nome}</option>`).join("");
  selectBloco.innerHTML = blocos.map(b => `<option value="${b}">${b}</option>`).join("");
}

selectServico.addEventListener("change", () => {
  textareaNovaDescricao.value = servicos[selectServico.value] || "Sem descrição";
  document.getElementById("titulo-servico-adicionar").textContent = selectServico.value;
});

formAdicionar.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!textareaNovaDescricao.value) return alert("Escreva a descrição da tarefa!");

  try {
    const res = await fetch(`${API_URL}/api/tarefas/criarTarefa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nome: selectServico.value,
        descricao: textareaNovaDescricao.value,
        bloco: selectBloco.value,
        data: new Date().toISOString(),
        idFuncionario: responsaveis.find(r => r.nome === selectResponsavel.value)._id,
        nomeFuncionario: selectResponsavel.value
      })
    });

    if (!res.ok) return alert(`Erro ao criar tarefa: ${(await res.json()).message}`);

    const dado = await res.json();
    const novasTarefas = (Array.isArray(dado) ? dado : [dado]).map(tarefa => {
      const dataObj = new Date(tarefa.data);
      return {
        id: tarefa._id,
        nome: tarefa.nome,
        descricao: tarefa.descricao,
        bloco: tarefa.bloco,
        data: dataObj.toLocaleDateString('pt-BR'),
        hora: dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: tarefa.status,
        idFuncionario: tarefa.idFuncionario,
        nomeFuncionario: tarefa.nomeFuncionario
      };
    });

    registrosPorData[dataAtual] = registrosPorData[dataAtual] || [];
    registrosPorData[dataAtual].push(...novasTarefas);

    renderHistorico();
    preencherFormulario(dataAtual, registrosPorData[dataAtual].length - 1);
    painelAdicionar.classList.add("d-none");
    painelVisualizacao.classList.remove("d-none");

  } catch (error) {
    console.error('Erro ao cadastrar tarefa:', error);
    alert('Erro ao cadastrar tarefa. Tente novamente.');
  }
});

// ======================== INICIALIZAÇÃO ==============================
popularSelects();
renderHistorico();

(() => {
  const primeiraData = Object.keys(registrosPorData)[0];
  if (!primeiraData) return;
  preencherFormulario(primeiraData, 0);
  painelVisualizacao.classList.remove("d-none");
  painelAdicionar.classList.add("d-none");
})();