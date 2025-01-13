document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let category = urlParams.get('category');

  if (!category) {
    console.error('Categoria não selecionada!');
    return; // Retorna caso nenhuma categoria seja passada.
  }

  // Definição dos filtros baseados na categoria
  const filterMap = {
    cpu: ['AMD', 'Intel'],
    mobo: ['AMD AM4', 'AMD AM5', 'Intel 1700', 'Intel 1200'],
    gpu: ['NVIDIA', 'AMD'],
    ram: ['8GB', '16GB', '32GB'],
    ssd: ['256GB', '512GB', '1TB'],
    hdd: ['1TB', '2TB', '4TB'],
    psu: ['500W', '650W', '750W'],
    cooling: ['Air Cooling', 'Liquid Cooling'],
    case: ['ATX', 'Micro-ATX', 'Mini-ITX'],
  };

  const filters = filterMap[category] || [];

  // Exibe os filtros na página
  const filtersContainer = document.getElementById('filters');
  if (filtersContainer) {
    const filtersHtml = filters.map(filter => `
      <label>
        <input type="checkbox" name="filter" value="${filter}">
        <span>${filter}</span>
      </label>
    `).join('');
    filtersContainer.innerHTML = filtersHtml;
  }

  // Função para renderizar produtos
  function renderProducts(products) {
    const productGrid = document.getElementById('produtos-grid');
    if (!productGrid) {
      console.error("Elemento 'produtos-grid' não encontrado!");
      return;
    }

    productGrid.innerHTML = ''; // Limpa o grid antes de carregar novos produtos

    if (products.length === 0) {
      productGrid.innerHTML = '<p>Nenhum produto encontrado para os critérios selecionados.</p>';
      return;
    }

    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product';

      // Acessa as propriedades com fallback
      const productName = product.nome || 'Nome do Produto Indisponível';
      const productPrice = product.preco || 'Preço Indisponível';
      const productImage = product.img || '../assets/default-image.jpg'; // Imagem padrão caso não tenha
      const productLink = product.link || '#'; // Link padrão caso não tenha

      // Renderiza o produto no grid
      productCard.innerHTML = `
        <a href="${productLink}" target="_blank">
          <img src="${productImage}" alt="${productName}">
          <p>${productName}</p>
        </a>
            <span class="price">${productPrice}</span>
        <button class="favorite-button">Favoritar</button>
      `;
      productGrid.appendChild(productCard);
    });
  }

  // Função para carregar produtos do JSON
  function loadProducts(category) {
    fetch('/api/getProducts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar produtos: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Dados recebidos:', data);
        renderProducts(data);
      })
      .catch(error => {
        console.error('Erro ao carregar produtos:', error);
        const productGrid = document.getElementById('produtos-grid');
        if (productGrid) {
          productGrid.innerHTML = `<p>Erro ao carregar produtos: ${error.message}</p>`;
        }
      });
  }

  // Função para executar o web scraping e carregar produtos
  function scrapeAndLoadProducts(category) {
    fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: [category] })
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Scripts executados!') {
          // Adiciona um atraso curto para garantir que o arquivo JSON seja atualizado
          setTimeout(() => {
            loadProducts(category);
          }, 2000);
        } else {
          throw new Error(data.error || 'Erro desconhecido.');
        }
      })
      .catch(error => {
        console.error('Erro ao executar web scraping:', error);
        const productGrid = document.getElementById('produtos-grid');
        if (productGrid) {
          productGrid.innerHTML = `<p>Erro ao carregar produtos: ${error.message}</p>`;
        }
      });
  }

  // Adiciona evento ao clicar em um link de categoria para redirecionar e executar o web scraping
  document.querySelectorAll('#divNav a').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      category = event.target.getAttribute('data-category');
      window.history.pushState(null, null, `/pages/products.html?category=${category}`);
      scrapeAndLoadProducts(category);
    });
  });

  // Carrega os produtos da categoria inicial ao carregar a página
  loadProducts(category);
});

function searchProducts(term) {
  const productGrid = document.getElementById('produtos-grid');
  const products = Array.from(productGrid.querySelectorAll('.product'));
  const noResultsMessageId = 'no-results-message'; // ID da mensagem de "nenhum resultado"

  if (!products.length) {
    console.error("Nenhum produto para filtrar.");
    return;
  }

  // Remove a mensagem de "nenhum resultado" existente (se houver)
  const existingMessage = document.getElementById(noResultsMessageId);
  if (existingMessage) {
    existingMessage.remove();
  }

  // Converte o termo para minúsculas para comparação
  const searchTerm = term.toLowerCase();
  let matchFound = false;

  products.forEach(product => {
    const productName = product.querySelector('p').innerText.toLowerCase();
    const isMatch = productName.includes(searchTerm);
    product.style.display = isMatch ? 'block' : 'none';
    if (isMatch) matchFound = true;
  });

  // Adiciona uma mensagem se nenhum produto for encontrado
  if (!matchFound) {
    const noResultsMessage = document.createElement('p');
    noResultsMessage.id = noResultsMessageId;
    noResultsMessage.innerText = "Nenhum produto encontrado.";
    noResultsMessage.style.textAlign = 'center';
    noResultsMessage.style.fontSize = '18px';
    noResultsMessage.style.color = '#555';
    noResultsMessage.style.marginTop = '20px';
    productGrid.appendChild(noResultsMessage);
  }
}

// Adiciona evento ao botão de pesquisa
document.getElementById('search-button').addEventListener('click', () => {
  const searchInput = document.getElementById('search-input').value.trim();
  searchProducts(searchInput);
});

// Permite busca ao pressionar "Enter" no campo de pesquisa
document.getElementById('search-input').addEventListener('keypress', event => {
  if (event.key === 'Enter') {
    const searchInput = event.target.value.trim();
    searchProducts(searchInput);
  }
});


