document.getElementById('addProductForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const productLink = document.getElementById('productLink').value;
    const userId = localStorage.getItem('userId'); // Presumindo que o ID do usuário está salvo no localStorage após o login

    if (!userId) {
        alert('Você precisa estar logado para adicionar um produto.');
        return;
    }

    const productData = {
        productLink,
        id_usuario: userId
    };

    try {
        const response = await fetch('/api/addProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Redireciona ou limpa o formulário após a adição bem-sucedida
            document.getElementById('addProductForm').reset();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        alert('Erro ao adicionar produto. Tente novamente mais tarde.');
    }
});
