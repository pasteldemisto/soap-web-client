let produtos_categoria = JSON.parse(localStorage.getItem('produtos')) || [
  { categoria: "Utensílios de Limpeza" },
  { categoria: "Materiais de Limpeza" },
  { categoria: "Produtos Químicos" },
  { categoria: "Descartáveis" },
  { categoria: "Outros" },
];

let produtos = [];

const mensagemStatus = document.getElementById('mensagem-status');

function exibirMensagem(texto, tipo = 'sucesso') {
  mensagemStatus.textContent = texto;
  mensagemStatus.className = `mt-3 fw-bold text-center text-${tipo === 'erro' ? 'danger' : 'success'}`;
  setTimeout(() => {
    mensagemStatus.textContent = '';
    mensagemStatus.className = 'mt-3 fw-bold text-center';
  }, 3000);
}

async function carregarProdutos() {
  try {
    const res = await fetch('http://localhost:3000/api/produtos/listarProdutos');
    const dados = await res.json();
    produtos = dados.map(p => ({
      _id: p._id,
      nome: p.nome,
      estoque: p.estoque,
      categoria: p.categoria
    }));

    preencherCategorias();
    renderizarProdutos(produtos);
    ativarEdicaoQuantidade();
  } catch (error) {
    console.error('Erro ao carregar produtos: ', error);
  }
}

carregarProdutos();

const campoPesquisa = document.getElementById('pesquisa');
const filtroCategoria = document.getElementById('filtro-categoria');
const container = document.getElementById('produtos-container');

function renderizarProdutos(lista) {
  container.innerHTML = '';

  lista.forEach(prod => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3';
    col.innerHTML = `
      <div class="border p-3 rounded bg-light d-flex flex-column align-items-center">
        <div class="fw-bold text-center">${prod.nome}</div>
        <div class="d-flex align-items-center gap-2 mt-2">
          <input type="number" class="form-control form-control-sm input-estoque text-center" 
            value="${Number.isFinite(prod.estoque) ? prod.estoque : 0}" data-id="${prod._id}" data-produto="${prod.nome}" min="0" style="width: 60px;">
          <span>und</span>
        </div>
        <div class="badge bg-secondary mt-2">${prod.categoria}</div>
        <div class="d-grid mt-2" style="width: 100%;">
            <button class="btn btn-sm btn-excluir" data-id="${prod._id}">
                🗑️ Excluir
            </button>
        </div>

      </div>
    `;
    container.appendChild(col);
    ativarExclusaoProduto();

  });
}

function preencherCategorias() {
  const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];

  filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';

  categoriasUnicas.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });
}


function aplicarFiltros() {
  const termo = campoPesquisa.value.toLowerCase();
  const categoriaSelecionada = filtroCategoria.value;

  const filtrados = produtos.filter(p => {
    const nomeCondiz = p.nome.toLowerCase().includes(termo);
    const categoriaCondiz = categoriaSelecionada === '' || p.categoria === categoriaSelecionada;
    return nomeCondiz && categoriaCondiz;
  });

  renderizarProdutos(filtrados);
}

campoPesquisa.addEventListener('input', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);



// Inicialização
preencherCategorias();
renderizarProdutos(produtos);
ativarEdicaoQuantidade();

function ativarEdicaoQuantidade() {
  const inputs = document.querySelectorAll('.input-estoque');

  inputs.forEach(input => {
    input.addEventListener('change', async () => {
      const id = input.getAttribute('data-id');
      const novaQtd = parseInt(input.value);

      if (isNaN(novaQtd) || novaQtd < 0) {
        exibirMensagem('⚠️ Quantidade inválida.', 'erro');
        return;
      }

      produtos = produtos.map(p => {
        if (p._id === id) {
          p.estoque = novaQtd;
        }
        return p;
      });

      const produtoEncontrado = produtos.find(p => p._id === id);

      if (produtoEncontrado) {
        try {
          await fetch(`http://localhost:3000/api/produtos/atualizarProduto/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estoque: novaQtd })
          });

          exibirMensagem('✅ Estoque atualizado com sucesso!');
          carregarProdutos();
        } catch (error) {
          console.error('Erro ao atualizar estoque:', error);
          exibirMensagem('❌ Erro ao atualizar estoque.', 'erro');
        }
      }
    });
  });
}

const btnRegistro = document.getElementById('btn-registro-produto');
const modal = document.getElementById('modal-produto');
const fecharModal = document.getElementById('fechar-modal');
const formProduto = document.getElementById('form-produto');

btnRegistro.addEventListener('click', () => {
  modal.style.display = 'flex';
  atualizarSelectCategoria();
});

fecharModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

function atualizarSelectCategoria() {
  const select = document.getElementById('input-categoria');
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  const categoriasUnicas = [...new Set(produtos_categoria.map(p => p.categoria))];
  categoriasUnicas.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

formProduto.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('input-nome').value.trim();
  const categoria = document.getElementById('input-categoria').value;
  const unidades = parseInt(document.getElementById('input-unidades').value);

  if (!nome || !categoria || !unidades || unidades <= 0) {
    exibirMensagem('⚠️ Preencha todos os campos corretamente.', 'erro');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/produtos/criarProduto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome,
        estoque: unidades,
        categoria: categoria
      })
    });

    if (!res.ok) {
      const erro = await res.json();
      exibirMensagem(`❌ Erro ao criar produto: ${erro.message}`, 'erro');
      return;
    }

    exibirMensagem('✅ Produto cadastrado com sucesso!');
    modal.style.display = 'none';
    formProduto.reset();
    carregarProdutos();

  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    exibirMensagem('❌ Erro na requisição. Tente novamente.', 'erro');
  }
});
function ativarExclusaoProduto() {
  const botoesExcluir = document.querySelectorAll('.btn-excluir');

  botoesExcluir.forEach(botao => {
    botao.addEventListener('click', async () => {
      const id = botao.getAttribute('data-id');
      const confirmar = confirm('Tem certeza que deseja excluir este produto?');

      if (!confirmar) return;

      try {
        const res = await fetch(`http://localhost:3000/api/produtos/deletarProduto/${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          const erro = await res.json();
          exibirMensagem(`❌ Erro ao excluir produto: ${erro.message}`, 'erro');
          return;
        }

        exibirMensagem('✅ Produto excluído com sucesso!');
        carregarProdutos(); // atualiza a lista

      } catch (err) {
        console.error('Erro ao excluir:', err);
        exibirMensagem('❌ Erro na requisição.', 'erro');
      }
    });
  });
}
