let usuarios = [];

window.addEventListener('DOMContentLoaded', () => {
  carregarPerfilGerente();
  renderizarListaUsuarios("");
});

// Navegação
document.getElementById('voltar-home')?.addEventListener('click', () => {
  window.location.href = 'home-gerente.html';
});

// Modal de cadastro
document.getElementById('abrir-modal').addEventListener('click', () => {
  document.getElementById('modal-usuario').style.display = 'flex';
});
document.getElementById('fechar-modal-usuario').addEventListener('click', () => {
  document.getElementById('modal-usuario').style.display = 'none';
});

// Submissão do formulário de cadastro do funcionário
document.getElementById('form-usuario').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome-usuario').value.trim();
  const cargo = document.getElementById('ocupacao-usuario').value;
  const email = document.getElementById('email-usuario').value.trim();
  const matricula = document.getElementById('matricula-usuario').value.trim();
  const senha = document.getElementById('senha-usuario').value;

  if (!nome || !cargo || !email || !matricula || !senha) {
    exibirMensagem("Preencha todos os campos obrigatórios.", "erro");
    return;
  }

  if (usuarios.some(u => u.matricula === matricula)) {
    alert("Matricula já cadastrada!");
    exibirMensagem("Matrícula já cadastrada.", "erro");
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/funcionarios/criarFuncionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, cargo, matricula, email, senha })
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error(erro);
      exibirMensagem(`Erro ao criar funcionário: ${erro.message}`, "erro");
      return;
    }

    exibirMensagem("Funcionário cadastrado com sucesso!", "sucesso");

  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);
    exibirMensagem("Erro ao cadastrar funcionário. Tente novamente.", "erro");
  }

  await buscarFuncionarios();
  document.getElementById('modal-usuario').style.display = 'none';
  e.target.reset();
});

// Atualiza a lista de usuários
async function buscarFuncionarios() {
  try {
    const res = await fetch('http://localhost:3000/api/funcionarios/listarFuncionarios', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error('Erro ao buscar funcionários: ', erro);
    }

    const funcionarios = await res.json();

    usuarios = funcionarios.map(f => ({
      _id: f._id,
      nome: f.nome,
      matricula: f.matricula,
      cargo: f.cargo,
      email: f.email,
      senha: f.senha
    }));

    renderizarListaUsuarios();
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
  }
}

buscarFuncionarios();

// Lista de usuários e busca
function renderizarListaUsuarios(filtro = "") {
  const lista = document.getElementById('lista-usuarios');
  lista.innerHTML = "";

  const termo = filtro.toLowerCase();
  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(termo) || u.matricula.includes(termo)
  );

  filtrados.forEach(usuario => {
    const item = document.createElement("div");
    item.className = "d-flex justify-content-between align-items-center bg-light px-2 py-1 rounded";
    item.style.cursor = "pointer";
    item.innerHTML = `<span>${usuario.nome}</span><small>${usuario.matricula}</small>`;
    item.onclick = () => preencherPainel(usuario);
    lista.appendChild(item);
  });
}

document.getElementById('busca-usuario').addEventListener("input", (e) => {
  renderizarListaUsuarios(e.target.value);
});

// Preenche o painel esquerdo
function preencherPainel(usuario) {
  idUsuarioAtual = usuario._id;
  document.getElementById('nome').textContent = usuario.nome;
  document.getElementById('matricula').textContent = usuario.matricula;
  document.getElementById('funcao').textContent = usuario.cargo;
  document.getElementById('email').textContent = usuario.email;
  document.getElementById('senha').textContent = "*************";

  document.getElementById('btn-solicitar-senha').style.display = 'block';
}


document.getElementById('btn-solicitar-senha')?.addEventListener('click', () => {
  const email = document.getElementById('email').textContent;
  const msg = document.getElementById('mensagem-email');
  msg.textContent = `Um e-mail com sua senha foi enviado para ${email}`;
  msg.style.display = 'block';

  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
});



async function carregarPerfilGerente() {
  try {
    const res = await fetch('http://localhost:3000/api/funcionarios/obterFuncionario', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error('Erro: ', erro);
      exibirMensagem(`Erro ao carregar funcionário: ${erro.message}`, "erro");
      return;
    }

    const dados = await res.json();
    const usuario = dados.funcionario;
    preencherPainel(usuario);
  } catch (error) {
    console.error('Erro ao carregar perfil do gerente: ', error);
    exibirMensagem("Você precisa estar logado para acessar essa página!", "erro");
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  }
}

let editando = false;
let idUsuarioAtual = null;

document.getElementById('btn-editar').addEventListener('click', async () => {
  const btn = document.getElementById('btn-editar');
  const nomeEl = document.getElementById('nome');
  const funcaoEl = document.getElementById('funcao');
  const emailEl = document.getElementById('email');

  if (!editando) {
    nomeEl.contentEditable = true;
    funcaoEl.contentEditable = true;
    emailEl.contentEditable = true;

    nomeEl.classList.add('border', 'rounded', 'p-1');
    funcaoEl.classList.add('border', 'rounded', 'p-1');
    emailEl.classList.add('border', 'rounded', 'p-1');

    btn.textContent = 'Salvar';
    editando = true;
  } else {
    const nome = nomeEl.textContent.trim();
    const cargo = funcaoEl.textContent.trim();
    const email = emailEl.textContent.trim();

    if (!nome || !cargo || !email) {
      exibirMensagem("Preencha todos os campos.", "erro");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/funcionarios/atualizarFuncionario/${idUsuarioAtual}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome, cargo, email })
      });

      if (!res.ok) {
        const erro = await res.json();
        exibirMensagem(`Erro ao atualizar: ${erro.message}`, "erro");
        return;
      }

      exibirMensagem("Dados atualizados com sucesso!", "sucesso");
      await buscarFuncionarios();

      nomeEl.contentEditable = false;
      funcaoEl.contentEditable = false;
      emailEl.contentEditable = false;

      nomeEl.classList.remove('border', 'rounded', 'p-1');
      funcaoEl.classList.remove('border', 'rounded', 'p-1');
      emailEl.classList.remove('border', 'rounded', 'p-1');

      btn.textContent = 'Editar';
      editando = false;

    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      exibirMensagem("Erro ao atualizar funcionário.", "erro");
    }
  }
});

// Função para mostrar mensagem na tela
function exibirMensagem(texto, tipo = "sucesso") {
  const el = document.getElementById("mensagem-feedback");
  if (!el) return;

  el.textContent = texto;
  el.className = `mensagem-feedback ${tipo}`;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}
