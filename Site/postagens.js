const usuario = localStorage.getItem("usuarioLogado");

if (!usuario) {
    window.location.href = "index.html";
} else {
    document.getElementById("usuarioLogado").textContent = "Usuário: " + usuario;
}

const campoConteudo = document.getElementById("conteudo");
const contador = document.getElementById("contador");

campoConteudo.addEventListener("input", () => {
    contador.textContent = campoConteudo.value.length;
});

carregarPostagens();

async function publicar() {
    const titulo = document.getElementById("titulo").value.trim();
    const conteudo = campoConteudo.value.trim();
    const mensagem = document.getElementById("mensagem");

    if (!titulo || !conteudo) {
        mensagem.textContent = "Preencha o título e o conteúdo.";
        return;
    }

    try {
        const res = await fetch("/postagens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, titulo, conteudo })
        });
        const dados = await res.json();
        mensagem.textContent = dados.mensagem;

        if (res.ok) {
            document.getElementById("titulo").value = "";
            campoConteudo.value = "";
            contador.textContent = "0";
            carregarPostagens();
        }
    } catch {
        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }
}

async function carregarPostagens() {
    try {
        const res = await fetch("/postagens");
        const postagens = await res.json();
        const feed = document.getElementById("feed");

        if (postagens.length === 0) {
            feed.innerHTML = "<p>Nenhuma postagem ainda.</p>";
            return;
        }

        feed.innerHTML = postagens.map(p => `
            <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
                <strong>${p.usuario}</strong>
                <small> — ${new Date(p.criado_em).toLocaleString("pt-BR")}</small>
                <h3>${p.titulo}</h3>
                <p>${p.conteudo}</p>
            </div>
        `).join("");
    } catch {
        document.getElementById("feed").innerHTML = "<p>Erro ao carregar postagens.</p>";
    }
}