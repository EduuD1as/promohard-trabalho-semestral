document.addEventListener('DOMContentLoaded', () => {
  // Executa o web scraping ao carregar a página
  fetch('/api/scrape')
    .then(response => response.text())
    .then(data => {
      console.log(data);
      // Após a execução do script de web scraping, carregue os produtos
      loadProdutos();
    })
    .catch(error => console.error('Erro ao executar o web scraping:', error));
});

function loadProdutos() {
  const categorias = ['cpu', 'gabinete', 'gpu', 'hdd', 'mobo', 'psu', 'ram', 'ssd']; // Adicione outras categorias conforme necessário

  categorias.forEach(categoria => {
    fetch(`/api/${categoria}`)
      .then(response => response.json())
      .then(data => {
        const grid = document.getElementById('produtos-grid');
        if (!grid) {
          console.error(`Elemento 'produtos-grid' não encontrado para categoria ${categoria}`);
          return;
        }
        data.forEach(produto => {
          const item = document.createElement('div');
          item.classList.add('product');
          item.innerHTML = `
              <a href="${produto.link}">
                <img src="${produto.imagem}" alt="${produto.nome}" />
                <p>${produto.nome}</p>
                <span class="price">${produto.preco}</span>
                <button>Favoritar Item</button>
              </a>
            `;
          grid.appendChild(item);
        });
      })
      .catch(error => console.error(`Erro ao carregar produtos da categoria ${categoria}:`, error));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");

  // Verifica se o token está armazenado no localStorage
  const token = localStorage.getItem("authToken");

  if (token) {
    // Usuário logado: altera o menu para incluir "Perfil" e "Sair"
    menu.innerHTML = `
      <li id="profile">
        <a href="../pages/profile.html">
          <img
            src="../assets/user-circle.svg"
            alt="Perfil"
            style="width: 24px; height: 24px; border-radius: 50%;"
          />
        </a>
      </li>
      <li>
        <button id="logoutButton" style="background: none; border: none; color: #333; cursor: pointer; font-family: 'Inter'; font-size: 16px; padding: 0; vertical-align: middle;">
          Sair
        </button>
      </li>
    `;

    // Adiciona evento ao botão de sair
    const logoutButton = document.getElementById("logoutButton");
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("authToken"); // Remove o token do localStorage
      alert("Você saiu com sucesso!");
      window.location.href = "/"; // Redireciona para a página inicial
    });
  }
});


