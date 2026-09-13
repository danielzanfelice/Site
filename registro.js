async function fazerRegistro(){
    const usuario = document.getElementById("novoUsuario").value;
    const senha = document.getElementById("novaSenha").value;
    const mensagem = document.getElementById("mensagem");

    if (usuario === "" || senha ==="") {
        mensagem.textContent = "Preencha usuario e senha.";
        return;
    }

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/registro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario, senha})
        });
        const dados = await resposta.json();
        mensagem.textContent = dados.mensagem;

        if (resposta.ok) {
            document.getElementById("novoUsuario").value = "";
            document.getElementById("novaSenha").value = "";
        }
    } catch (erro) {
        mensagem.textContent = "Não foi possivel conectar ao servidor." ;
    }
} 