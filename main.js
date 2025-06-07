document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const erroDiv = document.getElementById('erroLogin');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const matricula = document.getElementById('matricula').value;
    const senha = document.getElementById('senha').value;
    const botao = form.querySelector('button[type="submit"]');

    botao.disabled = true;

    try {

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/funcionarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matricula, senha })
      });

      if (!res.ok) {
        erroDiv.style.display = 'block';
        return
      }

      const data = await res.json();
      localStorage.setItem("token", data.token)
      const tipoUsuario = data.funcionario.cargo?.toLowerCase();
      

      erroDiv.style.display = 'none';


      if (tipoUsuario === 'gerente' || tipoUsuario === 'supervisor') {
        window.location.href = '/public/home-gerente.html';
      } else {
        window.location.href = '/public/home.html';
      }
      
    } catch (error){
      botao.disabled = false;
      console.error('Erro no login: ', error)
      erroDiv.style.display = 'block';
    }

    
  });
});