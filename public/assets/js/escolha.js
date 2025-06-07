const selecionados = new Set();
let funcionarioLogado = null;
import { API_URL } from './config.js';

// ======================= BUSCA DO FUNCIONÁRIO LOGADO =======================
async function buscarFuncionarioLogado() {
  try {
    const res = await fetch(`${API_URL}/api/funcionarios/obterFuncionario`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      console.error('Erro ao obter funcionário logado');
      exibirMensagem('Erro ao carregar funcionário logado.', 'danger');
      return;
    }

    const dados = await res.json();
    funcionarioLogado = dados.funcionario;
  } catch (error) {
    console.error('Erro ao buscar funcionário logado:', error);
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  }
}

// ======================= BUSCA DO BANCO =======================
async function buscarProdutos() {
  try {
    const res = await fetch(`${API_URL}/api/produtos/listarProdutos`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error('Erro ao buscar produtos:', erro.message);
      exibirMensagem('Erro ao carregar produtos.', 'danger');
      return;
    }

    const dados = await res.json();
    renderizarProdutos(dados);
  } catch (error) {
    console.error('Erro na requisição:', error);
    exibirMensagem('Erro ao se conectar com o servidor.', 'danger');
  }
}

// ======================= RENDERIZAÇÃO =======================
function renderizarProdutos(lista) {
  const container = document.getElementById('produtos-container');
  container.innerHTML = '';

  lista.forEach(prod => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3';

    col.innerHTML = `
      <div class="product-card border p-3 rounded bg-light d-flex flex-column align-items-center" data-produto="${prod.nome}">
        <div class="fw-bold text-center">${prod.nome}</div>
        <div class="text-muted mt-1">${prod.estoque ?? 0} und</div>
        ${prod.categoria ? `<div class="badge bg-secondary mt-2">${prod.categoria}</div>` : ''}
      </div>
    `;

    container.appendChild(col);
  });

  ativarSelecao();
}

// ======================= SELEÇÃO =======================
function ativarSelecao() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const produto = card.getAttribute('data-produto');
      card.classList.toggle('selected');

      if (selecionados.has(produto)) {
        selecionados.delete(produto);
      } else {
        selecionados.add(produto);
      }
    });
  });
}

// ======================= ENVIO =======================
async function enviarProdutos() {
  if (!funcionarioLogado) {
    exibirMensagem('Funcionário não identificado.', 'danger');
    return;
  }

  if (selecionados.size === 0) {
    exibirMensagem('Nenhum produto selecionado.', 'danger');
    return;
  }

  const produtosParaEnviar = Array.from(selecionados).map(nome => ({
    nome,
    quantidade: 1
  }));

  const payload = {
    solicitante: funcionarioLogado.nome,
    produtos: produtosParaEnviar
  };

  try {
    const res = await fetch(`${API_URL}/api/pedidos/criarPedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error('Erro ao enviar pedido:', erro.message);
      exibirMensagem(`Erro: ${erro.message}`, 'danger');
      return;
    }

    exibirMensagem('✅ Pedido enviado com sucesso!', 'success');

    for (const produto of produtosParaEnviar) {
      await fetch(`${API_URL}/api/produtos/atualizarEstoque`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: produto.nome,
          quantidade: -1 
        })
      });
    }


    await buscarProdutos();

    document.querySelectorAll('.product-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    selecionados.clear();

  } catch (error) {
    console.error('Erro de conexão:', error);
    exibirMensagem('Erro de conexão ao enviar pedido.', 'danger');
  }
}


// ======================= UTILIDADE: MENSAGEM =======================
function exibirMensagem(texto, tipo = 'success') {
  const msg = document.getElementById('mensagem-envio');
  if (!msg) return;

  msg.textContent = texto;
  msg.className = `text-center mt-3 fw-bold text-${tipo}`;
  msg.style.display = 'block';

  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}

// ======================= EVENTOS =======================
document.getElementById('botao-enviar')?.addEventListener('click', enviarProdutos);

// ======================= INICIALIZAÇÃO =======================
(async () => {
  await buscarFuncionarioLogado();
  await buscarProdutos();
})();
