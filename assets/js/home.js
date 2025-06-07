document.addEventListener('DOMContentLoaded', async () => {
  const inputNome = document.querySelector('input[readonly]');
  const inputHorario = document.querySelectorAll('input[readonly]')[1];
  const inputBloco = document.querySelectorAll('input[readonly]')[2];
  const textareaDescricao = document.querySelector('textarea');
  const tituloTarefa = document.getElementById('titulo-tarefa');
  const containerAgendamentos = document.getElementById('lista-agendamentos');
  const dateHeader = document.querySelector('.date-header');

  let registros = [];
  let indiceAtual = 0;

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const dataHoje = `${yyyy}-${mm}-${dd}`;
  dateHeader.textContent = `${dd}/${mm}/${yyyy}`;

  async function carregarTarefasDoDia() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tarefas/listarTarefas`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Erro ao buscar tarefas');

      const tarefas = await res.json();

      registros = tarefas
        .filter(t => new Date(t.data).toISOString().split('T')[0] === dataHoje)
        .map(t => ({
          nome: t.nomeFuncionario,
          horario: t.horario,
          bloco: t.bloco,
          tarefa: t.nome,
          descricao: t.descricao
        }));

    } catch (err) {
      console.error(err);
      alert('Erro ao carregar tarefas do dia.');
    }
  }

  function renderizarScheduleCards() {
    containerAgendamentos.innerHTML = '';
    registros.forEach((pessoa, index) => {
      const card = document.createElement('div');
      card.className = 'schedule-card d-flex justify-content-between align-items-center';
      card.setAttribute('data-id', index);

      card.innerHTML = `
        <div class="fw-bold text-primary">${pessoa.horario}</div>
        <div class="text-center flex-fill px-2">${pessoa.nome}</div>
        <div class="text-end text-muted">${pessoa.bloco}</div>
      `;

      card.addEventListener('click', () => preencherFormulario(index));
      containerAgendamentos.appendChild(card);
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

  document.getElementById('botao-perfil')?.addEventListener('click', () => {
    window.location.href = '/perfil.html';
  });

  await carregarTarefasDoDia();
  if (registros.length > 0) {
    preencherFormulario(0);
    renderizarScheduleCards();
  } else {
    containerAgendamentos.innerHTML = '<div class="text-center text-muted">Nenhuma tarefa para hoje.</div>';
    tituloTarefa.textContent = 'Sem tarefa';
    inputNome.value = '';
    inputHorario.value = '';
    inputBloco.value = '';
    textareaDescricao.value = '';
  }
});
  const botaoReposicao = document.getElementById('botao-reposicao');
  botaoReposicao?.addEventListener('click', () => {
    window.location.href = '/escolha.html';
  });

  const mensagemStatus = document.getElementById('mensagem-status');

