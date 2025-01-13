document.getElementById('consultarButton').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('input[name="category"]:checked');
    const selectedCategories = Array.from(checkboxes).map(cb => cb.value);

    if (selectedCategories.length > 0) {
        try {
            // Exibe um indicador de carregamento enquanto o web scraping é executado
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: selectedCategories })
            });

            const data = await response.json();

            if (response.ok) {
                // Considera apenas a primeira categoria selecionada
                const selectedCategory = selectedCategories[0];
                if (selectedCategory) {
                    // Salva a categoria no localStorage para consulta posterior
                    localStorage.setItem('selectedCategory', selectedCategory);
                    // Redireciona para a página de produtos
                    window.location.href = `/pages/products.html?category=${selectedCategory}`;
                } else {
                    alert('Por favor, selecione uma categoria.');
                }
            } else {
                alert('Erro ao executar web scraping: ' + (data.error || 'Erro desconhecido.'));
            }
        } catch (error) {
            console.error('Erro ao executar web scraping:', error);
            alert('Erro ao executar web scraping. Tente novamente mais tarde.');
        } finally {
            // Oculta o indicador de carregamento
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    } else {
        alert('Por favor, selecione pelo menos uma categoria.');
    }
});
