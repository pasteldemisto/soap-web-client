const email = [];

window.addEventListener('DOMContentLoaded', async () => {

  try{
    const res = await fetch('http://localhost:3000/api/funcionarios/obterFuncionario', {
      method: 'GET',
      credentials: 'include'
    })

    if (!res.ok) {
      const erro = await res.json();
      console.error('Erro: ', erro);
      return;
    }

    const dados = await res.json();
    const usuario = dados.funcionario;
    email.push(usuario.email);
    preencherPainel(usuario);
    

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    alert("Você precisa estar logado para acessar essa página!");
  }

});

function preencherPainel(usuario) {
  document.getElementById('nome').textContent = usuario.nome;
  document.getElementById('matricula').textContent = usuario.matricula;
  document.getElementById('funcao').textContent = usuario.cargo;
  document.getElementById('email').textContent = usuario.email;
  document.getElementById('senha').textContent = "********";
}

// Evento para voltar à home
const voltarBtn = document.getElementById('voltar-home');
if (voltarBtn) {
  voltarBtn.addEventListener('click', () => {
    window.location.href = '/home.html';
  });
}

// Evento do botão de solicitar senha
const botaoSolicitarSenha = document.querySelector('button.btn-outline-secondary');
const mensagemEmail = document.getElementById('mensagem-email');

botaoSolicitarSenha.addEventListener('click', () => {
  if (mensagemEmail) {
    mensagemEmail.textContent = `Um e-mail de redefinição foi enviado para ${email[0]}`;
    mensagemEmail.style.display = 'block';
  }
}); 