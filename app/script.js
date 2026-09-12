/* ==========================================
   VREI VALK - BASE DE DADOS LOCAL (localStorage)
   ========================================== */
const BD = {
  ler(chave, padrao) {
    try {
      return JSON.parse(localStorage.getItem(chave)) ?? padrao;
    } catch (e) {
      return padrao;
    }
  },
  salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  },
};

function usuarioAtual() {
  return localStorage.getItem("vvUsuario") || "";
}

function escaparTexto(texto) {
  return String(texto === undefined || texto === null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR");
}

/* ==========================================
   AUTENTICAÇÃO
   ========================================== */
function listarUsuarios() {
  return BD.ler("vvUsuarios", []);
}

function fazerLogin() {
  const usuario = (document.getElementById("usuario")?.value || "").trim();
  const senha = document.getElementById("senha")?.value || "";
  const mensagem = document.getElementById("mensagem");

  if (!usuario || !senha) return avisar(mensagem, "Preencha todos os campos!", false);

  const conta = listarUsuarios().find((c) => c.usuario.toLowerCase() === usuario.toLowerCase());
  if (!conta) return avisar(mensagem, "Usuário não encontrado. Crie uma conta.", false);
  if (conta.senha !== senha) return avisar(mensagem, "Senha incorreta.", false);

  localStorage.setItem("vvUsuario", conta.usuario);
  window.location.href = "feed.html";
}

function registrarConta() {
  const usuario = (document.getElementById("novo-usuario")?.value || "").trim();
  const email = (document.getElementById("novo-email")?.value || "").trim();
  const senha = document.getElementById("nova-senha")?.value || "";
  const confirmar = document.getElementById("confirmar-senha")?.value || "";
  const mensagem = document.getElementById("mensagem");

  if (!usuario || !email || !senha) return avisar(mensagem, "Preencha todos os campos!", false);
  if (usuario.length < 3) return avisar(mensagem, "O usuário precisa de ao menos 3 caracteres.", false);
  if (senha.length < 4) return avisar(mensagem, "A senha precisa de ao menos 4 caracteres.", false);
  if (senha !== confirmar) return avisar(mensagem, "As senhas não conferem.", false);

  const usuarios = listarUsuarios();
  if (usuarios.some((c) => c.usuario.toLowerCase() === usuario.toLowerCase())) {
    return avisar(mensagem, "Este usuário já existe.", false);
  }

  usuarios.push({ usuario, email, senha, criado_em: new Date().toISOString() });
  BD.salvar("vvUsuarios", usuarios);
  BD.salvar("vvPerfil_" + usuario, { email, nascimento: "", bio: "" });

  localStorage.setItem("vvUsuario", usuario);
  avisar(mensagem, "Conta criada! Entrando...", true);
  setTimeout(() => (window.location.href = "feed.html"), 700);
}

function avisar(elemento, texto, sucesso) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.style.color = sucesso ? "#3ddc84" : "#e5151a";
}

function sair() {
  localStorage.removeItem("vvUsuario");
  window.location.href = "index.html";
}

function exigirLogin() {
  if (!usuarioAtual()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

/* ==========================================
   TOPO / NAVEGAÇÃO
   ========================================== */
function montarTopo(paginaAtiva) {
  const topo = document.getElementById("topo");
  if (!topo) return;
  const paginas = [
    ["feed.html", "Feed"],
    ["postagens.html", "Postagens"],
    ["perfil.html", "Perfil"],
    ["suporte.html", "Suporte"],
  ];
  topo.innerHTML = `
    <img class="marca" src="brasao.png" alt="Escudo Vrei Valk">
    <span class="nome-marca">Vrei Valk</span>
    <nav>
      ${paginas
        .map(
          ([url, nome]) =>
            `<a href="${url}" class="${paginaAtiva === url ? "ativo" : ""}">${nome}</a>`
        )
        .join("")}
    </nav>
    <div class="direita">
      <span class="usuario-topo">@<strong>${escaparTexto(usuarioAtual())}</strong></span>
      <div class="sino-area">
        <button class="botao-sino" onclick="abrirNotificacoes()" aria-label="Notificações">
          🔔<span id="badge" class="oculto">0</span>
        </button>
        <div id="painel-notificacoes">
          <div id="lista-notificacoes"></div>
          <div style="padding:10px;border-top:1px solid #292929">
            <button class="botao secundario pequeno" onclick="limparNotificacoes()">Limpar tudo</button>
          </div>
        </div>
      </div>
      <button class="botao secundario pequeno" onclick="sair()">Sair</button>
    </div>`;
  carregarNotificacoes();
}

/* ==========================================
   NOTIFICAÇÕES
   ========================================== */
function obterNotificacoes() {
  return BD.ler("vvNotificacoes_" + usuarioAtual(), []);
}

function adicionarNotificacao(texto) {
  const notificacoes = obterNotificacoes();
  notificacoes.unshift({ texto, data: new Date().toLocaleString("pt-BR"), lida: false });
  BD.salvar("vvNotificacoes_" + usuarioAtual(), notificacoes.slice(0, 50));
  carregarNotificacoes();
}

function carregarNotificacoes() {
  const lista = document.getElementById("lista-notificacoes");
  const badge = document.getElementById("badge");
  if (!lista || !badge) return;

  const notificacoes = obterNotificacoes();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  badge.textContent = naoLidas > 9 ? "9+" : naoLidas;
  badge.classList.toggle("oculto", naoLidas === 0);

  lista.innerHTML = notificacoes.length
    ? notificacoes
        .map(
          (n, i) => `
        <div class="notificacao-item ${n.lida ? "" : "nao-lida"}" onclick="marcarNotificacao(${i})">
          <div>${escaparTexto(n.texto)}</div>
          <small>${escaparTexto(n.data)}</small>
        </div>`
        )
        .join("")
    : '<p class="notificacao-item">Nenhuma notificação.</p>';
}

function abrirNotificacoes() {
  document.getElementById("painel-notificacoes")?.classList.toggle("aberto");
}

function marcarNotificacao(indice) {
  const notificacoes = obterNotificacoes();
  if (!notificacoes[indice]) return;
  notificacoes[indice].lida = true;
  BD.salvar("vvNotificacoes_" + usuarioAtual(), notificacoes);
  carregarNotificacoes();
}

function limparNotificacoes() {
  localStorage.removeItem("vvNotificacoes_" + usuarioAtual());
  carregarNotificacoes();
}

/* ==========================================
   POSTAGENS
   ========================================== */
function listarPostagens() {
  return BD.ler("vvPosts", []);
}

function salvarPostagens(posts) {
  BD.salvar("vvPosts", posts);
}

function contadorFeed() {
  const conteudo = document.getElementById("conteudo");
  const contador = document.getElementById("contador-feed");
  if (conteudo && contador) contador.textContent = conteudo.value.length + "/1000";
}

function mostrarNomeFoto(input) {
  const nomeFoto = document.getElementById("nome-foto");
  if (nomeFoto) nomeFoto.textContent = input.files?.[0]?.name || "Nenhum arquivo escolhido";
}

function publicarPost() {
  const tituloInput = document.getElementById("titulo");
  const conteudoInput = document.getElementById("conteudo");
  const fotoInput = document.getElementById("foto-post");
  const mensagem = document.getElementById("mensagem-feed");

  const titulo = (tituloInput?.value || "").trim();
  const conteudo = (conteudoInput?.value || "").trim();
  if (!titulo || !conteudo) return avisar(mensagem, "Preencha título e conteúdo!", false);

  const gravar = (foto) => {
    const posts = listarPostagens();
    posts.unshift({
      id: Date.now(),
      usuario: usuarioAtual(),
      titulo,
      conteudo,
      foto: foto || "",
      criado_em: new Date().toISOString(),
      curtidas: [],
      comentarios: [],
    });
    salvarPostagens(posts);

    if (tituloInput) tituloInput.value = "";
    if (conteudoInput) conteudoInput.value = "";
    if (fotoInput) fotoInput.value = "";
    const nomeFoto = document.getElementById("nome-foto");
    if (nomeFoto) nomeFoto.textContent = "Nenhum arquivo escolhido";
    contadorFeed();
    avisar(mensagem, "Postagem publicada com sucesso!", true);
    adicionarNotificacao("Você publicou uma nova postagem.");
    carregarPostagens();
  };

  const arquivo = fotoInput?.files?.[0];
  if (arquivo) {
    const leitor = new FileReader();
    leitor.onload = (e) => gravar(e.target.result);
    leitor.readAsDataURL(arquivo);
  } else {
    gravar("");
  }
}

function carregarPostagens(filtroUsuario) {
  const container = document.getElementById("container-posts");
  if (!container) return;

  let postagens = listarPostagens();
  if (filtroUsuario) postagens = postagens.filter((p) => p.usuario === filtroUsuario);

  const termo = (window.termoBusca || "").toLowerCase();
  if (termo) {
    postagens = postagens.filter(
      (p) =>
        p.titulo.toLowerCase().includes(termo) ||
        p.conteudo.toLowerCase().includes(termo) ||
        p.usuario.toLowerCase().includes(termo)
    );
  }

  if (!postagens.length) {
    container.innerHTML = '<p class="vazio">Nenhuma postagem por aqui ainda.</p>';
    return;
  }

  const eu = usuarioAtual();
  container.innerHTML = postagens
    .map((post) => {
      const ehDono = post.usuario === eu;
      const curtidas = post.curtidas || [];
      const curtido = curtidas.includes(eu);

      const menu = ehDono
        ? `<div class="post-opcoes">
             <button class="botao-tres-pontos" onclick="this.nextElementSibling.classList.toggle('aberto')">⋮</button>
             <div class="menu-post">
               <button onclick="editarPost(${post.id})">Editar</button>
               <button class="botao-excluir" onclick="excluirPost(${post.id})">Excluir</button>
             </div>
           </div>`
        : "";

      const comentarios = (post.comentarios || []).length
        ? post.comentarios
            .map(
              (c) => `
          <div style="background:#1c1c1c;padding:8px 12px;border-radius:4px;font-size:13px;display:flex;gap:10px;align-items:flex-start">
            <div style="flex:1">
              <span style="color:#e5151a;font-weight:700">@${escaparTexto(c.usuario)}</span>
              <p style="margin:2px 0 0;color:#ccc;word-break:break-word">${escaparTexto(c.conteudo)}</p>
            </div>
            ${
              c.usuario === eu
                ? `<button class="botao-tres-pontos" title="Excluir" onclick="excluirComentario(${post.id}, ${c.id})">✕</button>`
                : ""
            }
          </div>`
            )
            .join("")
        : '<p class="vazio" style="margin:0">Nenhum comentário ainda.</p>';

      return `
      <div class="post" style="margin-bottom:18px">
        <div class="post-cabecalho">
          <div class="post-meta">
            <a href="perfil.html?user=${encodeURIComponent(post.usuario)}">@${escaparTexto(post.usuario)}</a>
            • <small>${formatarData(post.criado_em)}</small>
          </div>
          ${menu}
        </div>
        <h3>${escaparTexto(post.titulo)}</h3>
        <p class="post-conteudo">${escaparTexto(post.conteudo)}</p>
        ${post.foto ? `<img src="${post.foto}" alt="Imagem da postagem" style="max-width:100%;margin-top:12px;border:1px solid #292929;border-radius:6px">` : ""}
        <div style="display:flex;gap:16px;margin-top:14px;padding-top:10px;border-top:1px solid #222">
          <button onclick="curtirPost(${post.id})" style="background:transparent;border:0;cursor:pointer;font-size:13px;font-weight:700;color:${curtido ? "#e5151a" : "#fff"}">
            ❤ ${curtidas.length}
          </button>
          <button onclick="alternarComentarios(${post.id})" style="background:transparent;border:0;cursor:pointer;font-size:13px;font-weight:700;color:#777">
            💬 ${(post.comentarios || []).length} comentários
          </button>
        </div>
        <div id="caixa-comentarios-${post.id}" style="display:none;flex-direction:column;gap:10px;margin-top:12px;padding:12px;background:#0c0c0c;border:1px solid #222;border-radius:6px">
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto">${comentarios}</div>
          <div style="display:flex;gap:8px">
            <input type="text" id="input-comentario-${post.id}" placeholder="Escreva um comentário...">
            <button class="botao pequeno" onclick="comentarPost(${post.id})">Enviar</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function alternarComentarios(id) {
  const caixa = document.getElementById("caixa-comentarios-" + id);
  if (caixa) caixa.style.display = caixa.style.display === "flex" ? "none" : "flex";
}

function curtirPost(id) {
  const posts = listarPostagens();
  const post = posts.find((p) => p.id === id);
  if (!post) return;
  post.curtidas = post.curtidas || [];
  const eu = usuarioAtual();
  const i = post.curtidas.indexOf(eu);
  if (i >= 0) post.curtidas.splice(i, 1);
  else post.curtidas.push(eu);
  salvarPostagens(posts);
  recarregarListaAtual();
}

function comentarPost(id) {
  const input = document.getElementById("input-comentario-" + id);
  if (!input || !input.value.trim()) return;
  const posts = listarPostagens();
  const post = posts.find((p) => p.id === id);
  if (!post) return;
  post.comentarios = post.comentarios || [];
  post.comentarios.push({ id: Date.now(), usuario: usuarioAtual(), conteudo: input.value.trim() });
  salvarPostagens(posts);
  recarregarListaAtual();
  const caixa = document.getElementById("caixa-comentarios-" + id);
  if (caixa) caixa.style.display = "flex";
}

function excluirComentario(idPost, idComentario) {
  if (!confirm("Deseja apagar o seu comentário?")) return;
  const posts = listarPostagens();
  const post = posts.find((p) => p.id === idPost);
  if (!post) return;
  post.comentarios = (post.comentarios || []).filter((c) => c.id !== idComentario);
  salvarPostagens(posts);
  recarregarListaAtual();
  const caixa = document.getElementById("caixa-comentarios-" + idPost);
  if (caixa) caixa.style.display = "flex";
}

function editarPost(id) {
  const posts = listarPostagens();
  const post = posts.find((p) => p.id === id);
  if (!post || post.usuario !== usuarioAtual()) return;

  const novoTitulo = prompt("Novo título:", post.titulo);
  if (novoTitulo === null) return;
  const novoConteudo = prompt("Novo conteúdo:", post.conteudo);
  if (novoConteudo === null) return;
  if (!novoTitulo.trim() || !novoConteudo.trim()) return alert("Título e conteúdo não podem ficar em branco!");

  post.titulo = novoTitulo.trim();
  post.conteudo = novoConteudo.trim();
  salvarPostagens(posts);
  adicionarNotificacao("Você editou uma postagem.");
  recarregarListaAtual();
}

function excluirPost(id) {
  if (!confirm("Tem certeza que deseja excluir esta postagem?")) return;
  const posts = listarPostagens().filter((p) => !(p.id === id && p.usuario === usuarioAtual()));
  salvarPostagens(posts);
  adicionarNotificacao("Você excluiu uma postagem.");
  recarregarListaAtual();
}

function recarregarListaAtual() {
  carregarPostagens(window.filtroPostagens || null);
}

/* ==========================================
   BUSCA
   ========================================== */
function realizarBusca() {
  window.termoBusca = (document.getElementById("input-busca")?.value || "").trim();
  const resultados = document.getElementById("resultados-busca");
  if (resultados) {
    resultados.innerHTML = window.termoBusca
      ? `<p class="vazio">Mostrando resultados para "${escaparTexto(window.termoBusca)}".</p>`
      : "";
  }
  recarregarListaAtual();
}

/* ==========================================
   PERFIL
   ========================================== */
function contadorBio() {
  const bio = document.getElementById("bio");
  const contador = document.getElementById("contador-bio");
  if (bio && contador) contador.textContent = bio.value.length + "/500 caracteres";
}

function mostrarFotoPerfil(input) {
  const nomeFoto = document.getElementById("nome-foto-perfil");
  if (nomeFoto) nomeFoto.textContent = input.files?.[0]?.name || "Nenhum arquivo escolhido";
}

function salvarPerfil() {
  const usuario = usuarioAtual();
  const perfil = {
    email: document.getElementById("email")?.value || "",
    nascimento: document.getElementById("nascimento")?.value || "",
    bio: document.getElementById("bio")?.value || "",
  };
  BD.salvar("vvPerfil_" + usuario, perfil);

  const foto = document.getElementById("foto")?.files?.[0];
  const mensagem = document.getElementById("mensagem-perfil");

  if (foto) {
    const leitor = new FileReader();
    leitor.onload = (e) => {
      localStorage.setItem("vvFoto_" + usuario, e.target.result);
      avisar(mensagem, "Perfil e foto salvos!", true);
      adicionarNotificacao("Seu perfil e sua foto foram atualizados.");
      carregarPerfil();
    };
    leitor.readAsDataURL(foto);
  } else {
    avisar(mensagem, "Perfil salvo com sucesso!", true);
    adicionarNotificacao("Seu perfil foi atualizado.");
    carregarPerfil();
  }
}

function carregarPerfil() {
  const parametros = new URLSearchParams(window.location.search);
  const visitado = parametros.get("user");
  const eu = usuarioAtual();
  const usuario = visitado || eu;
  const proprio = usuario === eu;

  const perfil = BD.ler("vvPerfil_" + usuario, {});
  const nomePerfil = document.getElementById("nome-perfil");
  if (nomePerfil) nomePerfil.textContent = "@" + usuario;

  const avatar = document.getElementById("avatar");
  const foto = localStorage.getItem("vvFoto_" + usuario);
  if (avatar) {
    avatar.innerHTML = foto
      ? `<img src="${foto}" alt="Foto de perfil de ${escaparTexto(usuario)}" style="width:100%;height:100%;object-fit:cover">`
      : escaparTexto(usuario.charAt(0).toUpperCase());
  }

  const bioVisual = document.getElementById("bio-visual");
  if (bioVisual) bioVisual.textContent = perfil.bio || "Sem biografia ainda.";

  const formulario = document.getElementById("formulario-perfil");
  if (formulario) formulario.style.display = proprio ? "block" : "none";

  if (proprio) {
    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    if (email) email.value = perfil.email || "";
    if (nascimento) nascimento.value = perfil.nascimento || "";
    if (bio) bio.value = perfil.bio || "";
    contadorBio();
  }

  const posts = listarPostagens().filter((p) => p.usuario === usuario);
  const totalPosts = document.getElementById("total-posts");
  const totalCurtidas = document.getElementById("total-curtidas");
  const totalComentarios = document.getElementById("total-comentarios");
  if (totalPosts) totalPosts.textContent = posts.length;
  if (totalCurtidas) totalCurtidas.textContent = posts.reduce((s, p) => s + (p.curtidas || []).length, 0);
  if (totalComentarios) totalComentarios.textContent = posts.reduce((s, p) => s + (p.comentarios || []).length, 0);

  window.filtroPostagens = usuario;
  carregarPostagens(usuario);
}

/* ==========================================
   SUPORTE
   ========================================== */
function enviarChamado() {
  const assunto = (document.getElementById("assunto")?.value || "").trim();
  const categoria = document.getElementById("categoria")?.value || "Geral";
  const descricao = (document.getElementById("descricao")?.value || "").trim();
  const mensagem = document.getElementById("mensagem-suporte");

  if (!assunto || !descricao) return avisar(mensagem, "Preencha assunto e descrição!", false);

  const chamados = BD.ler("vvSuporte", []);
  chamados.unshift({
    id: Date.now(),
    usuario: usuarioAtual(),
    assunto,
    categoria,
    descricao,
    status: "Aberto",
    criado_em: new Date().toISOString(),
  });
  BD.salvar("vvSuporte", chamados);

  document.getElementById("assunto").value = "";
  document.getElementById("descricao").value = "";
  avisar(mensagem, "Chamado enviado! Nossa equipe responderá em breve.", true);
  adicionarNotificacao("Você abriu o chamado: " + assunto);
  carregarChamados();
}

function carregarChamados() {
  const lista = document.getElementById("lista-chamados");
  if (!lista) return;
  const chamados = BD.ler("vvSuporte", []).filter((c) => c.usuario === usuarioAtual());

  lista.innerHTML = chamados.length
    ? chamados
        .map(
          (c) => `
      <div class="cartao" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <strong>${escaparTexto(c.assunto)}</strong>
          <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.status === "Aberto" ? "#e5151a" : "#3ddc84"}">${escaparTexto(c.status)}</span>
        </div>
        <p class="post-conteudo" style="margin-top:8px">${escaparTexto(c.descricao)}</p>
        <div class="post-meta" style="margin-top:10px">${escaparTexto(c.categoria)} • ${formatarData(c.criado_em)}
          <button class="botao secundario pequeno" style="margin-left:10px" onclick="fecharChamado(${c.id})">Fechar</button>
        </div>
      </div>`
        )
        .join("")
    : '<p class="vazio">Você ainda não abriu nenhum chamado.</p>';
}

function fecharChamado(id) {
  const chamados = BD.ler("vvSuporte", []);
  const chamado = chamados.find((c) => c.id === id);
  if (!chamado) return;
  chamado.status = "Resolvido";
  BD.salvar("vvSuporte", chamados);
  carregarChamados();
}

/* ==========================================
   FECHAR PAINÉIS AO CLICAR FORA
   ========================================== */
document.addEventListener("click", function (evento) {
  if (!evento.target.closest(".sino-area")) {
    document.getElementById("painel-notificacoes")?.classList.remove("aberto");
  }
  if (!evento.target.closest(".post-opcoes")) {
    document.querySelectorAll(".menu-post.aberto").forEach((m) => m.classList.remove("aberto"));
  }
});
