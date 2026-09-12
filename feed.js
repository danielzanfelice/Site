const usuario = localStorage.getItem("furiaUsuario");

if (!usuario) {
    window.location.href = "index.html";
} else {
    const navUsuario = document.getElementById("nav-usuario");
    if (navUsuario) {
        navUsuario.textContent = usuario.toUpperCase();
    }
}

const campoConteudo = document.getElementById("conteudo");
const contador = document.getElementById("contador");

if (campoConteudo && contador) {
    contador.textContent = "0";
    campoConteudo.addEventListener("input", () => {
        contador.textContent = campoConteudo.value.length;
    });
}

function previewFoto(input) {
    const preview = document.getElementById("preview-foto");
    const uploadText = document.querySelector(".upload-area p");
    
    if (input.files && input.files[0]) {
        preview.src = URL.createObjectURL(input.files[0]);
        preview.style.display = "block";
        if (uploadText) {
            uploadText.textContent = input.files[0].name;
        }
    }
}

function sair() {
    localStorage.removeItem("furiaUsuario");
    window.location.href = "index.html";
}


function obtenerNotificacoes() {
    return JSON.parse(localStorage.getItem("furiaNotificacoes") || "[]");
}

function adicionarNotificacao(texto) {
    const notificacoes = obtenerNotificacoes();
    notificacoes.unshift({
        texto: texto,
        data: new Date().toLocaleString("pt-BR"),
        lida: false
    });
    localStorage.setItem("furiaNotificacoes", JSON.stringify(notificacoes.slice(0, 50)));
    carregarNotificacoes();
}

function carregarNotificacoes() {
    const lista = document.getElementById("lista-notificacoes");
    const badge = document.getElementById("badge");
    if (!lista || !badge) return;

    const notificacoes = obtenerNotificacoes();
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    if (naoLidas > 0) {
        badge.textContent = naoLidas > 9 ? "9+" : naoLidas;
        badge.classList.remove("oculto");
    } else {
        badge.classList.add("oculto");
    }

    if (notificacoes.length === 0) {
        lista.innerHTML = '<p class="notificacao-item" style="padding:10px; color:#aaa;">Nenhuma notificação.</p>';
        return;
    }

    lista.innerHTML = notificacoes.map((n, i) => `
        <div class="notificacao-item ${n.lida ? '' : 'nao-lida'}" style="padding:10px; border-bottom:1px solid #333; cursor:pointer;" onclick="marcarNotificacao(${i})">
            <div style="color:#fff; font-size:0.9rem;">${n.texto}</div>
            <small style="color:#888; font-size:0.75rem;">${n.data}</small>
        </div>
    `).join("");
}

function abrirNotificacoes() {
    const painel = document.getElementById("painel-notificacoes");
    if (painel) painel.classList.toggle("aberto");
}

function marcarNotificacao(indice) {
    const notificacoes = obtenerNotificacoes();
    if (!notificacoes[indice]) return;
    notificacoes[indice].lida = true;
    localStorage.setItem("furiaNotificacoes", JSON.stringify(notificacoes));
    carregarNotificacoes();
}

function limparNotificacoes() {
    localStorage.removeItem("furiaNotificacoes");
    carregarNotificacoes();
}


function alternarMenuPost(idPost) {
    document.querySelectorAll(".menu-dropdown").forEach(m => {
        if(m.id !== `menu-${idPost}`) m.classList.remove("aberto");
    });
    const menu = document.getElementById(`menu-${idPost}`);
    if (menu) menu.classList.toggle("aberto");
}

document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-opcoes")) {
        document.querySelectorAll(".menu-dropdown").forEach(m => m.classList.remove("aberto"));
    }
});

function marcarPessoa(idPost) {
    const nome = prompt("Digite o nome da pessoa que deseja marcar:");
    if (!nome || !nome.trim()) return;

    const marcadosLocais = JSON.parse(localStorage.getItem("furiaMarcados") || "{}");
    if (!marcadosLocais[idPost]) marcadosLocais[idPost] = [];
    
    marcadosLocais[idPost].push(nome.trim());
    localStorage.setItem("furiaMarcados", JSON.stringify(marcadosLocais));
    
    adicionarNotificacao(`${usuario} marcou ${nome.trim()} em uma postagem.`);
    carregarFeed();
}

async function excluirPost(idPost) {
    const confirmar = confirm("Deseja realmente excluir esta postagem?");
    if (!confirmar) return;

    try {
        const res = await fetch(`/postagens/${idPost}`, { method: "DELETE" });
        const dados = await res.json();

        if (res.ok) {
            adicionarNotificacao("Uma postagem sua foi excluída.");
            carregarFeed();
        } else {
            alert(dados.mensagem);
        }
    } catch {
        alert("Erro ao conectar ao servidor para excluir.");
    }
}

async function editarPost(idPost) {
    const card = document.getElementById(`post-card-${idPost}`);
    if (!card) return;

    const tituloAtual = card.querySelector(".post-titulo").textContent;
    const conteudoAtual = card.querySelector(".post-conteudo").textContent;

    const novoTitulo = prompt("Digite o novo título da postagem:", tituloAtual);
    if (novoTitulo === null) return;

    const novoConteudo = prompt("Digite o novo conteúdo da postagem:", conteudoAtual);
    if (novoConteudo === null) return;

    if (!novoTitulo.trim() || !novoConteudo.trim()) {
        alert("Título e conteúdo não podem ficar vazios.");
        return;
    }

    try {
        const res = await fetch(`/postagens/${idPost}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo: novoTitulo.trim(), conteudo: novoConteudo.trim() })
        });
        const dados = await res.json();

        if (res.ok) {
            adicionarNotificacao(`Você atualizou a postagem: "${novoTitulo.trim()}".`);
            carregarFeed();
        } else {
            alert(dados.mensagem);
        }
    } catch {
        alert("Erro ao conectar ao servidor para editar.");
    }
}


async function publicar() {
    const tituloInput = document.getElementById("titulo");
    const fotoInput = document.getElementById("foto");
    const msg = document.getElementById("mensagem-post");

    if (!tituloInput || !campoConteudo || !msg) return;

    const titulo = tituloInput.value.trim();
    const conteudo = campoConteudo.value.trim();
    const foto = fotoInput && fotoInput.files ? fotoInput.files[0] : null;

    if (!titulo || !conteudo) {
        msg.style.color = "#e5151a";
        msg.textContent = "Preencha o título e o conteúdo.";
        return;
    }

    const form = new FormData();
    form.append("usuario", usuario);
    form.append("titulo", titulo);
    form.append("conteudo", conteudo);
    if (foto) form.append("foto", foto);

    try {
        const res = await fetch("/postagens", { method: "POST", body: form });
        const dados = await res.json();
        
        msg.style.color = res.ok ? "#4ade80" : "#e5151a";
        msg.textContent = dados.mensagem;

        if (res.ok) {
            adicionarNotificacao(`Você publicou uma nova postagem: "${titulo}".`);
            
            tituloInput.value = "";
            campoConteudo.value = "";
            if (contador) contador.textContent = "0";
            if (fotoInput) fotoInput.value = "";
            
            const preview = document.getElementById("preview-foto");
            if (preview) preview.style.display = "none";
            
            const uploadText = document.querySelector(".upload-area p");
            if (uploadText) uploadText.textContent = "Clique para adicionar uma foto";
            
            carregarFeed();
        }
    } catch (erro) {
        msg.style.color = "#e5151a";
        msg.textContent = "Não foi possível conectar ao servidor.";
    }
}

function formatarData(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

async function carregarFeed() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const res = await fetch("/postagens");
        const posts = await res.json();

        if (!posts || posts.length === 0) {
            feed.innerHTML = '<div class="feed-vazio" style="color: #ccc; text-align: center; padding: 20px;">Nenhuma postagem ainda. Seja o primeiro!</div>';
            return;
        }

        const marcadosLocais = JSON.parse(localStorage.getItem("furiaMarcados") || "{}");

        feed.innerHTML = posts.map(p => {
            const pessoasMarcadas = marcadosLocais[p.id] || [];
            let textoMarcados = "";
            if (pessoasMarcadas.length > 0) {
                textoMarcados = `<p class="post-marcados">Marcados: ${pessoasMarcadas.join(", ")}</p>`;
            }

            let tagFoto = "";
            if (p.foto) {
                tagFoto = `<img class="post-foto" src="/uploads/${p.foto}" alt="foto da postagem" style="max-width: 100%; max-height: 400px; border-radius: 8px; display: block; margin-top: 10px; object-fit: cover;">`;
            }

            return `
                <div id="post-card-${p.id}" class="post-card" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; position: relative;">
                    <div class="post-options-container">
                        <button class="btn-opcoes" onclick="alternarMenuPost(${p.id})">⋮</button>
                        <div id="menu-${p.id}" class="menu-dropdown">
                            <button onclick="marcarPessoa(${p.id})">Marcar Pessoa</button>
                            <button onclick="editarPost(${p.id})">Editar Post</button>
                            <button style="color: #e5151a;" onclick="excluirPost(${p.id})">Excluir Post</button>
                        </div>
                    </div>
                    <div class="post-header" style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div class="avatar" style="background: #e5151a; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
                            ${p.usuario ? p.usuario.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div class="post-meta">
                            <div class="post-usuario" style="color: #fff; font-weight: bold;">${p.usuario || "Anônimo"}</div>
                            <div class="post-data" style="color: #888; font-size: 0.85rem;">${formatarData(p.criado_em)}</div>
                        </div>
                    </div>
                    <div class="post-body">
                        <div class="post-titulo" style="color: #fff; font-size: 1.25rem; font-weight: bold; margin-bottom: 8px;">${p.titulo}</div>
                        <div class="post-conteudo" style="color: #ccc; line-height: 1.5; white-space: pre-wrap; margin-bottom: 12px;">${p.conteudo}</div>
                        ${textoMarcados}
                        ${tagFoto}
                    </div>
                </div>
            `;
        }).join("");
    } catch (erro) {
        feed.innerHTML = '<div class="feed-vazio" style="color: #e5151a; text-align: center; padding: 20px;">Erro ao carregar postagens do servidor.</div>';
    }
}

carregarNotificacoes();
carregarFeed();

async function realizarBuscaUnificada() {
    const termo = document.getElementById("input-busca").value.trim();
    const containerResultados = document.getElementById("resultados-busca");

    if (!termo) {
        containerResultados.style.display = "none";
        return;
    }

    try {
        const resposta = await fetch(`/buscar?q=${encodeURIComponent(termo)}`);
        const dados = await resposta.json();

        containerResultados.innerHTML = "";
        containerResultados.style.display = "block";

        if (!resposta.ok || dados.erro) {
            containerResultados.innerHTML = `<p style="color: #e5151a; font-size: 13px;">${dados.erro || "Erro na busca."}</p>`;
            return;
        }

        if (dados.length === 0) {
            containerResultados.innerHTML = '<p style="color: #777; font-size: 13px;">Nenhum resultado encontrado no sistema.</p>';
            return;
        }

        // Renderiza cada tipo de resultado com uma etiqueta visual correspondente
        dados.forEach(item => {
            let badgeCor = "#777";
            let linkRedirecionamento = "#";
            let tipoLabel = item.tipo.toUpperCase();

            if (item.tipo === "postagem") {
                badgeCor = "#e5151a"; // Vermelho FURIA para posts
                linkRedirecionamento = `feed.html?post=${item.id}`;
            } else if (item.tipo === "usuario") {
                badgeCor = "#00ff00"; // Verde para Usuários
                linkRedirecionamento = `perfil.html?user=${item.resultado_titulo}`;
            } else if (item.tipo === "suporte") {
                badgeCor = "#ffaa00"; // Laranja para Suportes
                linkRedirecionamento = "suporte.html";
            }

            const divResultado = document.createElement("div");
            divResultado.style.padding = "12px";
            divResultado.style.borderBottom = "1px solid #292929";
            divResultado.style.display = "flex";
            divResultado.style.flexDirection = "column";
            divResultado.style.gap = "4px";

            divResultado.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: ${badgeCor}; color: #000; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px;">${tipoLabel}</span>
                    <a href="${linkRedirecionamento}" style="color: #fff; font-weight: bold; text-decoration: none; font-size: 14px;">${item.resultado_titulo}</a>
                </div>
                ${item.resultado_subtitulo ? `<p style="color: #aaa; font-size: 12px; margin: 0;">${item.resultado_subtitulo}</p>` : ""}
            `;

            containerResultados.appendChild(divResultado);
        });

    } catch (erro) {
        console.error("Erro ao processar busca:", erro);
        containerResultados.innerHTML = '<p style="color: #e5151a; font-size: 13px;">Não foi possível conectar ao servidor de buscas.</p>';
    }
}
