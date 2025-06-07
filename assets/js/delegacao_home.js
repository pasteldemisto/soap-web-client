let registros = [];

let servicos = {};
let responsaveis = [];
let blocos = [];

const listaAgendamentos = document.getElementById("lista-agendamentos");
const painelVisualizacao = document.getElementById("visualizacao-tarefa");
const painelAdicionar = document.getElementById("formulario-adicionar");
const btnAdicionar = document.getElementById("btn-adicionar");

const inputNome = painelVisualizacao.querySelectorAll("input")[0];
const inputHorario = painelVisualizacao.querySelectorAll("input")[1];
const inputBloco = painelVisualizacao.querySelectorAll("input")[2];
const textareaDescricao = painelVisualizacao.querySelector("textarea");
const tituloTarefa = document.getElementById("titulo-tarefa");

const selectServico = document.getElementById("select-servico");
const selectResponsavel = document.getElementById("select-responsavel");
const selectBloco = document.getElementById("select-bloco");
const inputHorarioNovo = document.getElementById("input-horario");
const textareaNovaDescricao = document.getElementById("textarea-descricao");
const formAdicionar = document.getElementById("form-adicionar");

const inputData = document.getElementById("input-data");

let indiceAtual = 0;

function atualizarDataCabecalho() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  inputData.value = `${yyyy}-${mm}-${dd}`;
}

function renderizarLista() {
  listaAgendamentos.innerHTML = "";
  registros.forEach((pessoa, index) => {
    const card = document.createElement("div");
    card.className = "schedule-card d-flex justify-content-between align-items-center";
    card.dataset.id = index;
    card.innerHTML = `
      <div class="fw-bold text-primary">${pessoa.horario}</div>
      <div class="text-center flex-fill px-2">${pessoa.nome}</div>
      <div class="text-end text-muted">${pessoa.bloco}</div>
    `;
    card.addEventListener("click", () => {
      preencherFormulario(index);
      painelVisualizacao.classList.remove("d-none");
      painelAdicionar.classList.add("d-none");
    });
    listaAgendamentos.appendChild(card);
  });
}

function preencherFormulario(index) {
  const pessoa = registros[index];
  indiceAtual = index;
  inputNome.value = pessoa.nome;
  inputHorario.value = pessoa.horario;
  inputBloco.value = pessoa.bloco;
  textareaDescricao.value = pessoa.descricao;
  tituloTarefa.textContent = pessoa.tarefa;
}

// Remoção
document.getElementById("botao-remover").onclick = () => {
  document.getElementById("confirmacao-remocao").classList.remove("d-none");
};

document.getElementById("btn-confirmar-nao").onclick = () => {
  document.getElementById("confirmacao-remocao").classList.add("d-none");
};

document.getElementById("btn-confirmar-sim").onclick = async () => {
  const idParaExcluir = registros[indiceAtual]?._id;

  if (!idParaExcluir) {
    alert("ID da tarefa não encontrado.");
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tarefas/deletarTarefa/${idParaExcluir}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Erro ao deletar tarefa");

    registros.splice(indiceAtual, 1);
    renderizarLista();
    preencherFormulario(0);
    document.getElementById("confirmacao-remocao").classList.add("d-none");
  } catch (err) {
    console.error(err);
    alert("Erro ao remover atribuição do banco.");
  }
};

async function carregarServicos() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/servicos/listarServicos`);
  const dados = await res.json();
  servicos = {};
  selectServico.innerHTML = '<option disabled selected>Selecione um serviço</option>';
  dados.forEach(s => {
    servicos[s.nome] = s.descricao;
    selectServico.innerHTML += `<option value="${s.nome}">${s.nome}</option>`;
  });
}

async function carregarFuncionarios() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/funcionarios/listarFuncionarios`, {
    credentials: "include"
  });
  const dados = await res.json();

  const operacionais = dados.filter(f => {
    const cargo = f.cargo?.toLowerCase();
    return cargo !== 'gerente' && cargo !== 'supervisor';
  });

  responsaveis = operacionais;
  selectResponsavel.innerHTML = '<option disabled selected>Selecione um responsável</option>';
  operacionais.forEach(f => {
    selectResponsavel.innerHTML += `<option value="${f.nome}">${f.nome}</option>`;
  });
}


async function carregarBlocos() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/blocos/listarBlocos`);
  const dados = await res.json();
  blocos = dados;
  selectBloco.innerHTML = '<option disabled selected>Selecione um bloco</option>';
  dados.forEach(b => {
    selectBloco.innerHTML += `<option value="${b.nome}">${b.nome}</option>`;
  });
}

selectServico.addEventListener("change", () => {
  textareaNovaDescricao.value = servicos[selectServico.value] || "";
  document.getElementById("titulo-servico-adicionar").textContent = selectServico.value;
});

btnAdicionar.addEventListener("click", () => {
  painelVisualizacao.classList.add("d-none");
  painelAdicionar.classList.remove("d-none");
});

formAdicionar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const novo = {
    nome: selectServico.value,
    descricao: textareaNovaDescricao.value,
    bloco: selectBloco.value,
    horario: inputHorarioNovo.value,
    data: inputData.value,
    nomeFuncionario: selectResponsavel.value,
    idFuncionario: responsaveis.find(f => f.nome === selectResponsavel.value)?._id
  };

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tarefas/criarTarefa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(novo)
  });

  const salva = await res.json();
  registros.push({
    _id: salva._id,
    nome: salva.nomeFuncionario,
    bloco: salva.bloco,
    horario: salva.horario,
    tarefa: salva.nome,
    descricao: salva.descricao
  });

  renderizarLista();
  preencherFormulario(registros.length - 1);
  painelAdicionar.classList.add("d-none");
  painelVisualizacao.classList.remove("d-none");
});

async function carregarTarefasDoDia() {
  const dataSelecionada = inputData.value;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tarefas/listarTarefas`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Erro ao carregar tarefas");

    const tarefas = await res.json();

    registros = tarefas.filter(t => {
      const dataNormalizada = new Date(t.data).toISOString().split("T")[0];
      return dataNormalizada === dataSelecionada;
    }).map(t => ({
      _id: t._id,
      nome: t.nomeFuncionario,
      bloco: t.bloco,
      horario: t.horario,
      tarefa: t.nome,
      descricao: t.descricao
    }));

  } catch (err) {
    console.error(err);
    alert("Erro ao buscar tarefas do dia");
  }
}

inputData.addEventListener("change", async () => {
  await carregarTarefasDoDia();
  renderizarLista();
});

(async () => {
  await carregarServicos();
  await carregarFuncionarios();
  await carregarBlocos();
  atualizarDataCabecalho();
  await carregarTarefasDoDia();
  renderizarLista();
})();
