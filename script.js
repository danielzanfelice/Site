const URL_SERVIDOR = "https://onrender.com"; // Substitua pelo seu link real da Render se for diferente
/* ==========================================
   FUNÇÕES GERAIS E CONTROLE DE SESSÃO
   ========================================== */
function usuarioAtual() {
    return localStorage.getItem("furiaUsuario") || "daniel";
}

function escaparTexto(texto) {
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "'");
}

/* ==========================================
   AUTENTICAÇÃO / LOGIN
   ========================================== */
function fazerLogin() {
    const usuario = document.getElementById("usuario")?.value.trim();
    const senha = document.getElementById("senha")?.value;
    const mensagem = document.getElementById("mensagem");

    if (!usuario || !senha) {
        if (mensagem) {
            mensagem.textContent = "Preencha todos os campos!";
            mensagem.style.color = "#e5151a";
        }
        return;
    }

    localStorage.setItem("furiaUsuario", usuario);
    window.location.href = "feed.html";
}

function sair() {
    localStorage.removeItem("furiaUsuario");
}

/* ==========================================
   SISTEMA DE NOTIFICAÇÕES (SININHO)
   ========================================== */
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
        lista.innerHTML = '<p class="notificacao-item">Nenhuma notificação.</p>';
        return;
    }

    lista.innerHTML = notificacoes.map(function(notificacao, indice) {
        return `
            <div class="notificacao-item ${notificacao.lida ? "" : "nao-lida"}" onclick="marcarNotificacao(${indice})">
                <div>${notificacao.texto}</div>
                <small>${notificacao.data}</small>
            </div>
        `;
    }).join("");
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

/* ==========================================
   GERENCIAMENTO DE PERFIL VISUAL
   ========================================== */
function contadorBio() {
    const bio = document.getElementById("bio");
    const contador = document.getElementById("contador-bio");
    if (bio && contador) {
        contador.textContent = bio.value.length + "/500 caracteres";
    }
}

function mostrarFotoPerfil(input) {
    const nomeFoto = document.getElementById("nome-foto-perfil");
    if (!nomeFoto) return;
    nomeFoto.textContent = input.files && input.files[0] ? input.files[0].name : "Nenhum arquivo escolhido";
}

function salvarPerfil() {
    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const foto = document.getElementById("foto");
    
    const usuarioLogado = usuarioAtual(); 
    const chavePerfilUsuario = "furiaPerfil_" + usuarioLogado;
    const chaveFotoUsuario = "furiaFoto_" + usuarioLogado;

    const perfil = {
        email: email ? email.value : "",
        nascimento: nascimento ? nascimento.value : "",
        bio: bio ? bio.value : ""
    };

    localStorage.setItem(chavePerfilUsuario, JSON.stringify(perfil));

    if (foto && foto.files && foto.files[0]) {
        const leitor = new FileReader();
        leitor.onload = function(evento) {
            localStorage.setItem(chaveFotoUsuario, evento.target.result);
            localStorage.setItem("furiaFoto", evento.target.result);

            if (typeof adicionarNotificacao === "function") {
                adicionarNotificacao("Seu perfil e sua foto foram updated.");
            }
            alert("Perfil salvo com sucesso!");
            if (typeof carregarPerfil === "function") carregarPerfil();
        };
        leitor.readAsDataURL(foto.files[0]);
    } else {
        if (typeof adicionarNotificacao === "function") {
            adicionarNotificacao("Seu perfil foi updated.");
        }
        alert("Perfil salvo com sucesso!");
    }
}

function carregarPerfil() {
    const perfil = JSON.parse(localStorage.getItem("furiaPerfil") || "{}");
    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const avatar = document.getElementById("avatar");

    if (email) email.value = perfil.email || "";
    if (nascimento) nascimento.value = perfil.nascimento || "";
    if (bio) bio.value = perfil.bio || "";

    contadorBio();
    const foto = localStorage.getItem("furiaFoto");

    if (avatar && foto) {
        avatar.innerHTML = `<img src="${foto}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }

    const nomePerfil = document.getElementById("nome-perfil");
    if (nomePerfil) nomePerfil.textContent = usuarioAtual();
}

/* ==========================================
   CONTADORES E AUXILIARES DO FEED
   ========================================== */
function contadorFeed() {
    const conteudo = document.getElementById("conteudo");
    const contador = document.getElementById("contador-feed");
    if (conteudo && contador) {
        contador.textContent = conteudo.value.length + "/1000";
    }
}

function mostrarNomeFoto(input) {
    const nomeFoto = document.getElementById("nome-foto");
    if (!nomeFoto) return;
    nomeFoto.textContent = input.files && input.files[0] ? input.files[0].name : "Nenhum arquivo escolher";
}
async function carregarPostagens() {
    const container = document.getElementById("container-posts");
    if (!container) return;

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/postagens`);
        if (!resposta.ok) throw new Error("Erro ao carregar");
        
        const postagens = await resposta.json();

        if (postagens.length === 0) {
            container.innerHTML = '<p style="color: #777; padding: 12px;">Nenhuma postagem no feed ainda.</p>';
            return;
        }

        container.innerHTML = postagens.map(function(post) {
            const tagFoto = post.foto ? `<img src="/uploads/${post.foto}" alt="Foto do Post" style="max-width: 100%; margin-top: 12px; border: 1px solid #292929;">` : "";
            const dataPost = post.criado_em ? new Date(post.criado_em).toLocaleString("pt-BR") : "";
            const usuarioLimpo = String(post.usuario).trim();

            // TRAVA DE SEGURANÇA MÁXIMA: Verifica se o dono do post é quem está logado na sessão
            const ehDonoDoPost = usuarioLimpo === usuarioAtual();
            
            // Só monta o HTML dos três pontinhos se o usuário logado for de fato o dono da postagem
            const menuOpcoesPostagem = ehDonoDoPost 
                ? `
                <div class="post-opcoes">
                    <button class="botao-tres-pontos" onclick="this.nextElementSibling.classList.toggle('aberto')">⋮</button>
                    <div class="menu-post">
                        <button onclick="window.editarPost(${post.id})">Editar</button>
                        <button class="botao-excluir" onclick="window.excluirPost(${post.id})">Excluir</button>
                    </div>
                </div>
                ` 
                : "";

            // Renderiza a lista de comentários com o menu de três pontinhos se for do próprio usuário
            const listaComentariosHTML = post.comentarios && post.comentarios.length > 0 
                ? post.comentarios.map(com => {
                    const ehMeuComentario = String(com.usuario).trim() === usuarioAtual();
                    
                    const botaoOpcoesComentario = ehMeuComentario 
                        ? `
                        <div style="margin-left: auto; position: relative; display: inline-block;">
                            <button class="botao-tres-pontos" style="background: transparent; border: 0; color: #777; cursor: pointer; font-size: 16px; padding: 0 4px; font-weight: bold;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">⋮</button>
                            <div class="menu-post-comentario" style="display: none; position: absolute; right: 0; top: 20px; background: #161616; border: 1px solid #292929; border-radius: 4px; z-index: 10; width: 80px; box-shadow: 0px 4px 10px rgba(0,0,0,0.5);">
                                <button style="width: 100%; background: transparent; border: 0; color: #fff; padding: 6px 10px; text-align: left; font-size: 11px; cursor: pointer; font-weight: bold;" onclick="editarComentario(${com.id}, ${post.id})" onmouseover="this.style.background='#222'" onmouseout="this.style.background='transparent'">Editar</button>
                                <button style="width: 100%; background: transparent; border: 0; color: #e5151a; padding: 6px 10px; text-align: left; font-size: 11px; cursor: pointer; font-weight: bold; border-top: 1px solid #292929;" onclick="excluirComentario(${com.id}, ${post.id})" onmouseover="this.style.background='#222'" onmouseout="this.style.background='transparent'">Excluir</button>
                            </div>
                        </div>
                        ` 
                        : "";

                    return `
                        <div style="background: #1c1c1c; padding: 8px 12px; border-radius: 4px; font-size: 13px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; position: relative;">
                            <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
                                <span style="color: #e5151a; font-weight: bold;">@${escaparTexto(com.usuario)}</span>
                                <p style="margin: 0; color: #ccc; word-break: break-word;">${escaparTexto(com.conteudo)}</p>
                            </div>
                            ${botaoOpcoesComentario}
                        </div>
                    `;
                }).join("")
                : `<p id="sem-comentarios-${post.id}" style="color: #555; font-size: 12px; margin: 0; padding: 4px;">Nenhum comentário ainda.</p>`;

            return `
                <div class="post" style="margin-bottom: 20px;">
                    <div class="post-cabecalho">
                        <div class="post-meta">
                            <a href="perfil.html?user=${encodeURIComponent(usuarioLimpo)}" style="color: #e5151a; font-weight: bold; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#e5151a'">
                                @${escaparTexto(post.usuario)}
                            </a> • <small>${dataPost}</small>
                        </div>
                        <!-- Injeta o menu de opções apenas se for validado como dono -->
                        ${menuOpcoesPostagem}
                    </div>
                    <h3>${escaparTexto(post.titulo)}</h3>
                    <p class="post-conteudo">${escaparTexto(post.conteudo)}</p>
                    ${tagFoto}

                    <!-- INTERAÇÕES -->
                    <div style="display: flex; gap: 16px; margin-top: 14px; padding-top: 10px; border-top: 1px solid #222; align-items: center;">
                        <button onclick="curtirPost(${post.id}, this)" style="background: transparent; border: 0; color: #fff; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;" onmouseover="this.style.color='#e5151a'" onmouseout="this.style.color='#fff'">
                            ❤️ <span class="contagem-curtidas">${post.curtidas || 0}</span>
                        </button>
                        <button onclick="document.getElementById('caixa-comentarios-${post.id}').style.display = document.getElementById('caixa-comentarios-${post.id}').style.display === 'none' ? 'flex' : 'none'" style="background: transparent; border: 0; color: #777; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#777'">
                            💬 Comentários
                        </button>
                    </div>

                    <!-- CAIXA DE COMENTÁRIOS -->
                    <div id="caixa-comentarios-${post.id}" style="display: none; flex-direction: column; gap: 10px; margin-top: 12px; padding: 12px; background: #0c0c0c; border-radius: 6px; border: 1px solid #222;">
                        <div id="lista-comentarios-${post.id}" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                            ${listaComentariosHTML}
                        </div>
                        
                        <div style="display: flex; gap: 8px; margin-top: 4px;">
                            <input type="text" id="input-comentario-${post.id}" placeholder="Escreva um comentário..." style="flex: 1; background: #161616; border: 1px solid #292929; color: #fff; padding: 6px 10px; font-size: 13px; outline: none;">
                            <button onclick="comentarPost(${post.id})" style="background: #e5151a; color: #fff; border: 0; padding: 0 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; cursor: pointer;">Enviar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (erro) {
        console.error("Erro ao carregar postagens do banco:", erro);
        container.innerHTML = '<p style="color: #e5151a; padding: 12px;">Erro ao carregar postagens do servidor.</p>';
    }
}
async function curtirPost(idPost, botaoElemento) {
    if (!idPost) return;

    try {
        const resposta = await fetch(`/postagens/${idPost}/curtir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: usuarioAtual() })
        });
        
        const dados = await resposta.json();
        
        if (resposta.ok && dados.curtidas !== undefined) {
            const spanContagem = botaoElemento.querySelector(".contagem-curtidas");
            if (spanContagem) {
                // Atualiza o número na tela com o valor exato devolvido pelo servidor
                spanContagem.textContent = dados.curtidas;
            }

            // Feedback visual de cor baseado na trava por usuário
            if (dados.curtiu) {
                botaoElemento.style.color = "#e5151a"; // Fica vermelho vivo ao curtir
            } else {
                botaoElemento.style.color = "#fff"; // Volta para branco ao descurtir
            }
        } else {
            console.error("Erro retornado pelo servidor:", dados);
        }
    } catch (erro) {
        console.error("Erro de conexão ao curtir:", erro);
    }
}
async function comentarPost(idPost) {
    const input = document.getElementById(`input-comentario-${idPost}`);
    if (!input || !input.value.trim()) return;

    const conteudoComentario = input.value.trim();
    input.value = ""; // Limpa a caixa de texto imediatamente

    try {
        const resposta = await fetch(`/postagens/${idPost}/comentar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario: usuarioAtual(),
                conteudo: conteudoComentario
            })
        });

        if (resposta.ok) {
            // Recarrega o feed para exibir o novo comentário de forma organizada
            await carregarPostagens();
            // Mantém a caixa de comentários aberta após atualizar
            const caixa = document.getElementById(`caixa-comentarios-${idPost}`);
            if (caixa) caixa.style.display = "flex";
        } else {
            alert("Erro ao enviar comentário.");
        }
    } catch (erro) {
        console.error("Erro ao comentar postagem:", erro);
    }
}
/* ==========================================
   AÇÕES DO FEED: EXCLUIR COMENTÁRIO
   ========================================== */
async function excluirComentario(idComentario, idPost) {
    if (!idComentario) {
        alert("Erro: ID do comentário não foi identificado.");
        return;
    }
    
    if (!confirm("Deseja realmente apagar o seu comentário?")) return;

    try {
        const resposta = await fetch(`/comentarios/${idComentario}`, {
            method: "DELETE"
        });

        // Tenta capturar a mensagem exata enviada pelo servidor
        const dados = await resposta.json();

        if (resposta.ok) {
            await carregarPostagens();
            // Mantém a caixa de comentários aberta após atualizar
            const caixa = document.getElementById(`caixa-comentarios-${idPost}`);
            if (caixa) caixa.style.display = "flex";
        } else {
            // Exibe o erro exato retornado pelo servidor em vez de uma mensagem genérica
            alert(dados.mensagem || dados.erro || "Erro ao excluir comentário.");
        }
    } catch (erro) {
        console.error("Erro na requisição de deletar comentário:", erro);
        alert("Não foi possível conectar ao servidor para excluir.");
    }
}

/* ==========================================
   AÇÕES DO FEED: EDITAR COMENTÁRIO (BLINDADO)
   ========================================== */
async function editarComentario(idComentario, idPost) {
    if (!idComentario) {
        alert("Erro: ID do comentário não foi identificado.");
        return;
    }

    const novoConteudo = prompt("Digite a nova mensagem do seu comentário:");
    if (novoConteudo === null) return; 

    if (!novoConteudo.trim()) {
        alert("O comentário não pode ficar em branco!");
        return;
    }

    try {
        const resposta = await fetch(`/comentarios/${idComentario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conteudo: novoConteudo.trim() })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            await carregarPostagens();
            const caixa = document.getElementById(`caixa-comentarios-${idPost}`);
            if (caixa) caixa.style.display = "flex";
        } else {
            alert(dados.mensagem || dados.erro || "Erro ao atualizar comentário.");
        }
    } catch (erro) {
        console.error("Erro ao editar comentário:", erro);
        alert("Não foi possível conectar ao servidor para editar.");
    }
}
async function publicarPost() {
    const tituloInput = document.getElementById("titulo");
    const conteudoInput = document.getElementById("conteudo");
    const fotoInput = document.getElementById("foto-post");
    const mensagem = document.getElementById("mensagem-feed");

    const titulo = tituloInput ? tituloInput.value.trim() : "";
    const conteudo = conteudoInput ? conteudoInput.value.trim() : "";

    if (!titulo || !conteudo) {
        if (mensagem) {
            mensagem.textContent = "Preencha título e conteúdo!";
            mensagem.style.color="#e5151a";
        }
        return;
    }
    const dadosFormulario = new FormData();
    dadosFormulario.append("usuario", usuarioAtual());
    dadosFormulario.append("titulo", titulo); 
    dadosFormulario.append("conteudo", conteudo);

    if (fotoInput && fotoInput.files && fotoInput.files[0]){
        dadosFormulario.append("foto", fotoInput.files[0]);
    }

    try {
        const resposta = await fetch("/postagens", {
            method: "POST",
            body: dadosFormulario
        });
        const dados = await resposta.json();

        if (resposta.ok) {
            if (mensagem) {
                mensagem.textContent = "Postagem publicada com sucesso!";
                mensagem.style.color = "#00ff00"; 
            }
            if (tituloInput) tituloInput.value = "";
            if (conteudoInput) conteudoInput.value = "";
            if (fotoInput) fotoInput.value = "";
            
            const nomeFoto = document.getElementById("nome-foto");
            if (nomeFoto) nomeFoto.textContent = "Clique para adicionar uma foto";

            contadorFeed();
            adicionarNotificacao(usuarioAtual() + " publicou uma nova postagem.");
            carregarPostagens();
        } else {
            if (mensagem) {
                mensagem.textContent = dados.mensagem || "Erro ao salvar postagem.";
                mensagem.style.color = "#e5151a";
            }
        }
    } catch (erro) {
        console.error("Erro na requisição de postagem:", erro);
        if (mensagem) {
            mensagem.textContent = "Não foi possível conectar ao servidor.";
            mensagem.style.color = "#e5151a";
        }
    }
}

async function excluirPost(id) {
    if (!confirm("TEM certeza que deseja excluir esta postagem permanente do banco?"))
        return;
    try {
        // CORREÇÃO: Adicionadas crases na URL
        const respostaExcluir = await fetch(`/postagens/${id}`, {
            method: "DELETE"
        });
        const dados = await respostaExcluir.json();
        if (respostaExcluir.ok) {
            alert(dados.mensagem || "Postagem excluída!");
            carregarPostagens();
        } else {
            alert(dados.mensagem || "Erro ao excluir.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}

async function editarPost(id) {
    if (!id) {
        alert("ID da postagem inválido.");
        return;
    }
    const novoTitulo = prompt("Digite o novo título da postagem:");
    if (novoTitulo === null) return; 
    const novoConteudo = prompt("Digite o novo conteúdo da postagem:");
    if (novoConteudo === null) return; 

    if (!novoTitulo.trim() || !novoConteudo.trim()) {
        alert("Título e Conteúdo não podem ficar em branco!");
        return;
    }
    try {
        // CORREÇÃO: Adicionadas crases na URL
        const respostaEditar = await fetch(`/postagens/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                titulo: novoTitulo.trim(),
                conteudo: novoConteudo.trim()
            })
        });
        const dados = await respostaEditar.json();
        if (respostaEditar.ok) {
            alert(dados.mensagem || "Postagem actualizada com sucesso!");
            carregarPostagens();
        } else {
            alert(dados.mensagem || "Erro ao atualizar a postagem.");
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Erro ao conectar com o servidor. Verifique sua conexão.");
    }
}

async function realizarBuscaUnificada() {
    const inputBusca = document.getElementById("input-busca");
    const containerResultados = document.getElementById("resultados-busca");
    if (!inputBusca || !containerResultados) return;

    const termo = inputBusca.value.trim();
    if (!termo) {
        containerResultados.style.display = "none";
        return;
    }
    try {
        // CORREÇÃO: Adicionadas crases na URL
        const respostaBusca = await fetch(`/buscar?q=${encodeURIComponent(termo)}`);
        const dados = await respostaBusca.json();
        containerResultados.innerHTML = "";
        containerResultados.style.display = "block";

        // CORREÇÃO: Adicionadas crases no bloco HTML
        if (!respostaBusca.ok || dados.erro) {
            containerResultados.innerHTML = `<p style="color: #e5151a; padding: 12px; font-size: 13px; margin: 0;">${dados.erro || "Erro na busca."}</p>`;
            return;
        }

        if (dados.length === 0) {
            containerResultados.innerHTML = '<p style="color: #888; padding: 12px; font-size: 13px; margin: 0;">Nenhum resultado encontrado no sistema.</p>';
            return;
        }

        dados.forEach(function(item) {
            let badgeCor = "#777";
            let linkRedirecionamento = "#";
            let tipoLabel = String(item.tipo).toUpperCase();

            // CORREÇÃO: Adicionadas crases nas URLs dinâmicas
            if (item.tipo === "postagem") {
                badgeCor = "#e5151a";
                linkRedirecionamento = `feed.html?post=${item.id}`;
            } else if (item.tipo === "usuario") {
                badgeCor = "#00cc00";
                linkRedirecionamento = `perfil.html?user=${encodeURIComponent(item.resultado_titulo)}`;
            } else if (item.tipo === "suporte") {
                badgeCor = "#ffaa00";
                linkRedirecionamento = "suporte.html";
            }

            const divResultado = document.createElement("div");
            divResultado.style.padding = "12px";
            divResultado.style.borderBottom = "1px solid #292929";
            divResultado.style.display = "flex";
            divResultado.style.flexDirection = "column";
            divResultado.style.gap = "4px";
            divResultado.style.background = "#161616";

            // CORREÇÃO: Adicionadas crases e corrigida a lógica de renderização do subtítulo
            divResultado.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; background: #161616;"> 
                    <span style="background: ${badgeCor}; color: #000; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px;">${tipoLabel}</span> 
                    <a href="${linkRedirecionamento}" style="color: #fff; font-weight: bold; text-decoration: none; font-size: 14px;">${item.resultado_titulo}</a> 
                </div> 
                ${item.resultado_subtitulo ? `<span style="color: #888; font-size: 12px;">${item.resultado_subtitulo}</span>` : ""}
            `;
            containerResultados.appendChild(divResultado);
        });
    } catch (erro) {
        console.error("Erro ao processar busca:", erro);
        containerResultados.innerHTML = '<p style="color: #e5151a; padding: 12px; font-size: 13px; margin: 0;">Não foi possível conectar ao servidor.</p>';
    }
}

async function carregarPedidosAmizadeNoSininho() {
    const lista = document.getElementById("lista-notificacoes");
    const badge = document.getElementById("badge");
    const usuarioLogado = localStorage.getItem("furiaUsuario");
    if (!lista || !usuarioLogado) return;

    try {
        // CORREÇÃO: Adicionadas crases na URL
        const resposta = await fetch(`/amizades/pendentes?usuario=${encodeURIComponent(usuarioLogado)}`);
        if (!resposta.ok) return;
        const pedidos = await resposta.json();
        
        document.querySelectorAll(".notificacao-item.solicitacao-amizade").forEach(el => el.remove());

        if (pedidos.length > 0) {
            if (badge) {
                badge.textContent = pedidos.length;
                badge.classList.remove("oculto");
            }
            pedidos.forEach(pedido => {
                const itemPedido = document.createElement("div");
                itemPedido.className = "notificacao-item nao-lida solicitacao-amizade";
                itemPedido.style.borderLeft = "3px solid #00ff00";
                itemPedido.style.display = "flex";
                itemPedido.style.flexDirection = "column";
                itemPedido.style.gap = "8px";

                // CORREÇÃO: Adicionadas crases na estrutura HTML interna
                itemPedido.innerHTML = `
                    <div><strong>@${escaparTexto(pedido.remetente)}</strong> te enviou uma solicitação de amizade.</div> 
                    <div style="display: flex; gap: 8px;"> 
                        <button onclick="responderPedidoAmizade(${pedido.id}, 'aceito', this)" style="background: #00ff00; color: #000; border: 0; padding: 4px 10px; font-weight: bold; cursor: pointer; font-size: 11px; text-transform: uppercase;">Aceitar</button> 
                        <button onclick="responderPedidoAmizade(${pedido.id}, 'recusado', this)" style="background: #e5151a; color: #fff; border: 0; padding: 4px 10px; font-weight: bold; cursor: pointer; font-size: 11px; text-transform: uppercase;">Recusar</button> 
                    </div>
                `;
                lista.insertBefore(itemPedido, lista.firstChild);
            });
        } else if (badge) {
            badge.classList.add("oculto");
        }
    } catch (erro) {
        console.error("Erro ao carregar pedidos de amizade:", erro);
    }
}

async function responderPedidoAmizade(idSolicitacao, acao, botaoElemento) {
    try {
        const resposta = await fetch("/amizades/responder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_solicitacao: idSolicitacao, acao: acao })
        });
        const dados = await resposta.json();
        if (resposta.ok) {
            const containerPai = botaoElemento.parentElement;
            // CORREÇÃO: Adicionadas crases no HTML de feedback
            containerPai.innerHTML = `<span style="color: ${acao === 'aceito' ? '#00ff00' : '#e5151a'}; font-weight: bold; font-size: 11px;">${acao === 'aceito' ? 'ACEITO!' : 'RECUSADO!'}</span>`;
            setTimeout(() => {
                containerPai.parentElement.remove();
                const badge = document.getElementById("badge");
                if (badge) {
                    const contagem = parseInt(badge.textContent) || 0;
                    if (contagem > 1) {
                        badge.textContent = contagem - 1;
                    } else {
                        badge.textContent = "0";
                        badge.classList.add("oculto");
                    }
                }
            }, 1500);
        } else {
            alert(dados.erro || "Erro ao processar resposta.");
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}

function inicializarAtualizacaoTempoReal() {
    carregarPerfil();
    carregarPostagens();
    setTimeout(carregarPedidosAmizadeNoSininho, 300);
    setInterval(async function() {
        if (document.getElementById("container-posts")) {
            await carregarPostagens();
        }
        if (document.getElementById("lista-notificacoes")) {
            await carregarPedidosAmizadeNoSininho();
        }
    }, 5000);
}

document.addEventListener("DOMContentLoaded", inicializarAtualizacaoTempoReal);

/* ==========================================
   INTERCEPTADOR DE CLIQUES (MENU FLUTUANTE)
   ========================================== */
document.addEventListener("click", function(evento) {
    const elementoClicado = evento.target;

    // 1. Intercepta cliques em links de perfil para abrir o menu de contexto do amigo
    if (elementoClicado && elementoClicado.tagName === "A" && elementoClicado.href.includes("perfil.html?user=")) {
        const menusAntigos = document.querySelectorAll(".menu-amigo-flutuante");
        menusAntigos.forEach(m => m.remove());

        evento.preventDefault();
        evento.stopPropagation();

        const urlAlvo = elementoClicado.href;
        const textoUsuario = elementoClicado.textContent.trim();
        const usuarioLimpo = textoUsuario.replace("@", "").replace(/'/g, "\\'").replace(/"/g, '\\"');

        const menuFlutuante = document.createElement("div");
        menuFlutuante.className = "menu-amigo-flutuante";
        menuFlutuante.style.position = "absolute";
        menuFlutuante.style.background = "#161616";
        menuFlutuante.style.border = "1px solid #292929";
        menuFlutuante.style.borderRadius = "4px";
        menuFlutuante.style.padding = "4px 0";
        menuFlutuante.style.width = "140px";
        menuFlutuante.style.boxShadow = "0px 4px 15px rgba(0,0,0,0.7)";
        menuFlutuante.style.zIndex = "999999";

        const larguraMenu = 140;
        let posicaoX = evento.pageX;
        if (posicaoX + larguraMenu > window.innerWidth + window.scrollX) {
            posicaoX = evento.pageX - larguraMenu; 
        }

        menuFlutuante.style.top = (evento.pageY + 10) + "px";
        menuFlutuante.style.left = posicaoX + "px";

        menuFlutuante.innerHTML = `
            <button onclick="window.location.href='${urlAlvo}'" style="width: 100%; background: transparent; border: 0; color: #fff; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1f1f1f'" onmouseout="this.style.background='transparent'">
                Visitar perfil
            </button>
            <button onclick="event.stopPropagation(); abrirPopupChatVisual('${usuarioLimpo}')" style="width: 100%; background: transparent; border: 0; color: #fff; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s; border-top: 1px solid #292929;" onmouseover="this.style.background='#1f1f1f'" onmouseout="this.style.background='transparent'">
                Mandar mensagem
            </button>
        `;

        document.body.appendChild(menuFlutuante);
        return;
    }

    // 2. Fecha o menu flutuante se clicar em qualquer outra parte vazia da tela
    if (!elementoClicado.closest(".menu-amigo-flutuante")) {
        const menusAntigos = document.querySelectorAll(".menu-amigo-flutuante");
        menusAntigos.forEach(m => m.remove());
    }
});

/* ==========================================
   SISTEMA DE CHAT EM TEMPO REAL (POLLING)
   ========================================== */
let amigoChatAtivo = null;
let intervaloChatTempoReal = null;

function abrirPopupChatVisual(nomeAmigo, devePiscarIncial = false) {
    amigoChatAtivo = nomeAmigo.trim();
    const chatExistente = document.getElementById("furia-popup-chat");

    if (chatExistente && chatExistente.getAttribute("data-amigo") === amigoChatAtivo) {
        if (!devePiscarIncial) {
            const topoChat = document.getElementById("furia-chat-topo-barra");
            if (topoChat) topoChat.classList.remove("furia-piscar-alerta");
            marcarMensagensComoLidas(amigoChatAtivo);
        }
        return;
    }

    if (chatExistente) chatExistente.remove();
    clearInterval(intervaloChatTempoReal);

    const popup = document.createElement("div");
    popup.id = "furia-popup-chat";
    popup.setAttribute("data-amigo", amigoChatAtivo);
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.right = "25px";
    popup.style.width = "300px";
    popup.style.height = "380px";
    popup.style.background = "#161616";
    popup.style.border = "1px solid #292929";
    popup.style.borderRadius = "8px 8px 0 0";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.zIndex = "9999999";
    popup.style.boxShadow = "0px 4px 20px rgba(0,0,0,0.9)";

    const classPiscar = devePiscarIncial ? "furia-piscar-alerta" : "";

    popup.innerHTML = `
        <div id="furia-chat-topo-barra" class="${classPiscar}" style="background: #0c0c0c; padding: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #292929; border-radius: 8px 8px 0 0; cursor: pointer;" onclick="removerPiscarAoClicarNoChat()">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: #00ff00; border-radius: 50%;"></div>
                <span style="color: #fff; font-weight: bold; font-size: 13px;">Chat: @${escaparTexto(amigoChatAtivo)}</span>
            </div>
            <button onclick="event.stopPropagation(); clearInterval(intervaloChatTempoReal); amigoChatAtivo = null; document.getElementById('furia-popup-chat').remove();" style="background: transparent; border: 0; color: #777; font-size: 16px; cursor: pointer; font-weight: bold;" onmouseover="this.style.color='#e5151a'" onmouseout="this.style.color='#777'">×</button>
        </div>
        <div id="furia-chat-conteudo" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #0c0c0c;"></div>
        <div style="padding: 10px; border-top: 1px solid #292929; display: flex; gap: 8px; background: #161616;">
            <input type="text" id="furia-chat-input" placeholder="Digite uma mensagem..." style="flex: 1; background: #0c0c0c; border: 1px solid #292929; color: #fff; padding: 8px 10px; font-size: 12px; outline: none; font-family: inherit;" onclick="removerPiscarAoClicarNoChat()">
            <button onclick="enviarMensagemChatReal()" style="background: #e5151a; color: #fff; border: 0; padding: 0 14px; font-weight: bold; font-size: 11px; text-transform: uppercase; cursor: pointer; letter-spacing: 1px;">Enviar</button>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("furia-chat-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") enviarMensagemChatReal();
    });

    if (!devePiscarIncial) marcarMensagensComoLidas(amigoChatAtivo);
    
    carregarMensagensDoBanco();
    intervaloChatTempoReal = setInterval(carregarMensagensDoBanco, 1500);
}
async function carregarMensagensDoBanco() {
  const areaTexto = document.getElementById("furia-chat-conteudo");
  const meuUsuario = usuarioAtual();
  if (!areaTexto || !amigoChatAtivo) return;

  try {
    const resposta = await fetch(`/mensagens/historico?remetente=${encodeURIComponent(meuUsuario)}&destinatario=${encodeURIComponent(amigoChatAtivo)}`);
    if (!resposta.ok) return;

    const historico = await resposta.json();
    const estavaNoFinal = areaTexto.scrollHeight - areaTexto.scrollTop <= areaTexto.clientHeight + 40;

    let ultimoIndiceMeu = -1;
    for (let i = historico.length - 1; i >= 0; i--) {
      if (historico[i].remetente === meuUsuario) {
        ultimoIndiceMeu = i;
        break;
      }
    }

    areaTexto.innerHTML = historico.map(function(msg, indice) {
      const ehMinha = msg.remetente === meuUsuario;
      const alinhamento = ehMinha ? "align-self: flex-end; background: #e5151a; color: #fff;" : "align-self: flex-start; background: #161616; color: #ccc; border: 1px solid #292929;";
      
      let dataFormatada = "";
      if (msg.criado_em) {
        const d = new Date(msg.criado_em);
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        dataFormatada = `${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      let linhaVisualizacao = "";
      if (ehMinha && indice === ultimoIndiceMeu && msg.lida === 1) {
        linhaVisualizacao = `
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 2px; margin-right: 4px;">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="15" height="15" fill="none">
              <polyline points="2 12 12 17 22 7" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
              <polyline points="7 12 12 15 21 6" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </svg>
            <span style="font-size: 11px; color: #888; font-family: inherit;">${dataFormatada}</span>
          </div>
        `;
      } else if (ehMinha) {
        linhaVisualizacao = `<div style="text-align: right; font-size: 11px; color: #555; margin-top: 2px; margin-right: 4px;">${dataFormatada}</div>`;
      } else {
        linhaVisualizacao = `<div style="text-align: left; font-size: 11px; color: #555; margin-top: 2px; margin-left: 4px;">${dataFormatada}</div>`;
      }

      return `
        <div style="display: flex; flex-direction: column; width: 100%;">
          <div style="max-width: 80%; padding: 8px 12px; font-size: 12px; border-radius: 6px; word-wrap: break-word; ${alinhamento}">
            ${escaparTexto(msg.conteudo)}
          </div>
          ${linhaVisualizacao}
        </div>
      `;
    }).join("");

    if (estavaNoFinal) areaTexto.scrollTop = areaTexto.scrollHeight;
  } catch (erro) {
    console.error("Erro no polling de mensagens:", erro);
  }
}

async function enviarMensagemChatReal() {
  const campo = document.getElementById("furia-chat-input");
  const meuUsuario = usuarioAtual();
  if (!campo || !campo.value.trim() || !amigoChatAtivo) return;

  const texto = campo.value.trim();
  campo.value = "";

  try {
    await fetch("/mensagens/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remetente: meuUsuario, destinatario: amigoChatAtivo, conteudo: texto })
    });
    carregarMensagensDoBanco();
  } catch (erro) {
    console.error("Erro ao enviar mensagem para o banco:", erro);
  }
}

async function marcarMensagensComoLidas(amigo) {
  const meuUsuario = usuarioAtual();
  if (!amigo || !meuUsuario) return;
  try {
    await fetch("/mensagens/marcar-lidas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remetente: amigo.trim(), destinatario: meuUsuario.trim() })
    });
  } catch (e) {
    console.error(e);
  }
}

function removerPiscarAoClicarNoChat() {
  if (!amigoChatAtivo) return;
  const topoChat = document.getElementById("furia-chat-topo-barra");
  if (topoChat && topoChat.classList.contains("furia-piscar-alerta")) {
    topoChat.classList.remove("furia-piscar-alerta");
    marcarMensagensComoLidas(amigoChatAtivo);
  }
}

async function verificarNovasMensagensParaSubirEPiscar() {
  const meuUsuario = usuarioAtual();
  try {
    const resposta = await fetch(`/mensagens/nao-lidas?usuario=${encodeURIComponent(meuUsuario)}`);
    if (!resposta.ok) return;

    const naoLidas = await resposta.json();
    naoLidas.forEach(item => {
      if (item.total > 0) {
        if (!amigoChatAtivo) {
          abrirPopupChatVisual(item.remetente.trim(), true);
        } else if (item.remetente.trim() !== amigoChatAtivo) {
          aplicarEfeitoPiscarAmigo(item.remetente.trim());
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
}

function aplicarEfeitoPiscarAmigo(nomeAmigo) {
  const linksAmigos = document.querySelectorAll("#lista-amigos-lateral a");
  linksAmigos.forEach(el => {
    if (el.textContent.includes(`@${nomeAmigo}`)) {
      el.classList.add("furia-piscar-alerta");
    }
  });
}

const cssPiscarCompleto = document.createElement("style");
cssPiscarCompleto.innerHTML = `
  @keyframes furiaPiscarAnimaBarra {
    0% { background-color: #0c0c0c; }
    50% { background-color: #e5151a; }
    100% { background-color: #0c0c0c; }
  }
  .furia-piscar-alerta {
    animation: furiaPiscarAnimaBarra 1s infinite !important;
  }
`;
document.head.appendChild(cssPiscarCompleto);
