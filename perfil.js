const URL_SERVIDOR = "https://sitefuria.onrender.com";

// Usuário da sessão (lê de furiaUsuario ou usuarioLogado)
const usuarioSessao = localStorage.getItem("furiaUsuario") || localStorage.getItem("usuarioLogado") || "daniel";
const urlParams = new URLSearchParams(window.location.search);
const usuarioURL = urlParams.get("user");
const usuarioSessaoAlvo = usuarioURL ? usuarioURL.trim() : usuarioSessao;
const ehProprioPerfil = !usuarioURL || (usuarioURL.toLowerCase() === usuarioSessao.toLowerCase());

const chavePerfilUsuario = "furiaPerfil_" + usuarioSessaoAlvo;
const chaveFotoUsuario = "furiaFoto_" + usuarioSessaoAlvo;

// Contador de caracteres da biografia
function contadorBio() {
    const bio = document.getElementById("bio");
    const contador = document.getElementById("contador-bio");

    if (bio && contador) {
        contador.textContent = bio.value.length + "/500 caracteres";
    }
}

// Atualiza o texto do nome do arquivo da foto selecionada
function mostrarFotoPerfil(input) {
    const nomeFoto = document.getElementById("nome-foto-perfil");
    if (!nomeFoto) return;

    nomeFoto.textContent = input.files && input.files[0]
        ? input.files[0].name
        : "Nenhum arquivo escolhido";
}

// 1. CARREGAR PERFIL (Busca do banco de dados na Render e sincroniza com a tela)
async function carregarPerfil() {
    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const avatar = document.getElementById("avatar");
    const btnAmigo = document.getElementById("btn-adicionar-amigo");
    const tituloPerfil = document.getElementById("titulo-perfil");
    const textoNomeUsuario = document.getElementById("usuario-nome-texto");
    const nomePerfil = document.getElementById("nome-perfil");
    const btnSalvar = document.querySelector(".btn-principal");
    const inputFoto = document.getElementById("foto");
    const nomeFoto = document.getElementById("nome-foto-perfil");

    // Título e identificação do usuário
    if (tituloPerfil) {
        tituloPerfil.textContent = ehProprioPerfil ? "Meu perfil" : "Perfil de " + usuarioSessaoAlvo;
    }
    if (nomePerfil) {
        nomePerfil.textContent = ehProprioPerfil ? "Meu perfil" : "Perfil de " + usuarioSessaoAlvo;
    }
    if (textoNomeUsuario) {
        textoNomeUsuario.textContent = usuarioSessaoAlvo;
    }

    // Controle de exibição (esconde edição e mostra botão de amizade se for outro usuário)
    if (!ehProprioPerfil) {
        if (email) email.disabled = true;
        if (nascimento) nascimento.disabled = true;
        if (bio) bio.disabled = true;
        if (btnSalvar) btnSalvar.style.display = "none";
        if (inputFoto) inputFoto.style.display = "none";
        if (nomeFoto) nomeFoto.style.display = "none";

        if (btnAmigo) {
            btnAmigo.style.display = "flex";
            btnAmigo.disabled = false;
            btnAmigo.style.borderColor = "#e5151a";
            btnAmigo.style.color = "#ffffff";
            btnAmigo.setAttribute("onclick", "enviarPedidoAmizade()");
            btnAmigo.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <circle cx="18" cy="14" r="5" stroke="#e5151a"></circle>
                    <line x1="18" y1="11" x2="18" y2="17" stroke="#e5151a"></line>
                    <line x1="15" y1="14" x2="21" y2="14" stroke="#e5151a"></line>
                </svg>
            `;
            atualizarIconeAmizadeVisual(btnAmigo);
        }
    } else {
        if (email) email.disabled = false;
        if (nascimento) nascimento.disabled = false;
        if (bio) bio.disabled = false;
        if (btnSalvar) btnSalvar.style.display = "block";
        if (inputFoto) inputFoto.style.display = "block";
        if (nomeFoto) nomeFoto.style.display = "inline";
        if (btnAmigo) btnAmigo.style.display = "none";
    }

    // Busca dados no servidor (banco de dados)
    try {
        const resposta = await fetch(`${URL_SERVIDOR}/perfil?usuario=${encodeURIComponent(usuarioSessaoAlvo)}`);
        if (resposta.ok) {
            const dados = await resposta.json();

            if (email && dados.email) email.value = dados.email;
            if (nascimento && dados.data_nascimento) {
                nascimento.value = dados.data_nascimento.split("T")[0];
            }
            if (bio && dados.biografia) {
                bio.value = dados.biografia;
                contadorBio();
            }

            if (avatar) {
                if (dados.foto) {
                    const urlFoto = dados.foto.startsWith("http") ? dados.foto : `${URL_SERVIDOR}/uploads/${dados.foto}`;
                    avatar.innerHTML = `<img src="${urlFoto}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    localStorage.setItem(chaveFotoUsuario, urlFoto);
                } else {
                    const fotoLocal = localStorage.getItem(chaveFotoUsuario);
                    if (fotoLocal) {
                        avatar.innerHTML = `<img src="${fotoLocal}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        avatar.innerHTML = `<img src="avatar-padrao.png" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    }
                }
            }
            return;
        }
    } catch (erro) {
        console.warn("Servidor inacessível, buscando perfil local:", erro);
    }

    // Fallback local se o servidor estiver carregando
    const dadosLocais = localStorage.getItem(chavePerfilUsuario);
    const perfil = JSON.parse(dadosLocais || "{}");
    if (email && !email.value) email.value = perfil.email || "";
    if (nascimento && !nascimento.value) nascimento.value = perfil.nascimento || "";
    if (bio && !bio.value) {
        bio.value = perfil.bio || "";
        contadorBio();
    }
    const fotoLocal = localStorage.getItem(chaveFotoUsuario);
    if (avatar && !avatar.querySelector("img")) {
        if (fotoLocal) {
            avatar.innerHTML = `<img src="${fotoLocal}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatar.innerHTML = `<img src="avatar-padrao.png" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }
}

// 2. SALVAR PERFIL (Envia arquivo e dados para o banco na nuvem e guarda cache)
async function salvarPerfil() {
    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const foto = document.getElementById("foto");

    const perfil = {
        email: email ? email.value : "",
        nascimento: nascimento ? nascimento.value : "",
        bio: bio ? bio.value : ""
    };

    localStorage.setItem(chavePerfilUsuario, JSON.stringify(perfil));

    const formData = new FormData();
    formData.append("usuario", usuarioSessao);
    formData.append("email", email ? email.value : "");
    formData.append("dataNascimento", nascimento ? nascimento.value : "");
    formData.append("biografia", bio ? bio.value : "");

    if (foto && foto.files && foto.files[0]) {
        formData.append("foto", foto.files[0]);
    }

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/perfil`, {
            method: "POST",
            body: formData
        });
        const dados = await resposta.json();

        if (dados && dados.sucesso) {
            if (foto && foto.files && foto.files[0]) {
                const leitor = new FileReader();
                leitor.onload = function(evento) {
                    localStorage.setItem(chaveFotoUsuario, evento.target.result);
                    if (usuarioSessaoAlvo === usuarioSessao) {
                        localStorage.setItem("furiaFoto", evento.target.result);
                    }
                    if (typeof adicionarNotificacao === "function") {
                        adicionarNotificacao("Seu perfil e sua foto foram atualizados.");
                    }
                    alert("Perfil salvo com sucesso!");
                    carregarPerfil();
                };
                leitor.readAsDataURL(foto.files[0]);
            } else {
                if (typeof adicionarNotificacao === "function") {
                    adicionarNotificacao("Seu perfil foi atualizado.");
                }
                alert("Perfil salvo com sucesso!");
                carregarPerfil();
            }
        } else {
            alert(dados.mensagem || "Erro ao salvar perfil no servidor.");
        }
    } catch (err) {
        console.error("Erro ao conectar com a Render:", err);
        alert("Erro de conexão ao salvar perfil.");
    }
}

// 3. ATUALIZA ÍCONE VISUAL DE AMIZADE
async function atualizarIconeAmizadeVisual(btnAmigo) {
    if (!btnAmigo || usuarioSessaoAlvo === usuarioSessao) return;

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/amizades/lista?usuario=${encodeURIComponent(usuarioSessao)}`);
        if (!resposta.ok) return;

        const amigos = await resposta.json();
        const jaSaoAmigos = Array.isArray(amigos) && amigos.some(function(amigo) {
            return String(amigo.nome_amigo).trim().toLowerCase() === String(usuarioSessaoAlvo).trim().toLowerCase();
        });

        if (jaSaoAmigos) {
            btnAmigo.style.borderColor = "#00ff00";
            btnAmigo.style.color = "#00ff00";
            btnAmigo.disabled = false;
            btnAmigo.title = "Clique para desfazer amizade";
            btnAmigo.setAttribute("onclick", "desfazerAmizade()");
            btnAmigo.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="15 14 18 17 22 12" stroke="#00ff00"></polyline>
                </svg>
            `;
        }
    } catch (erro) {
        console.error("Erro ao verificar lista de amizades:", erro);
    }
}

// 4. ENVIAR PEDIDO DE AMIZADE
async function enviarPedidoAmizade() {
    const btnAmigo = document.getElementById("btn-adicionar-amigo");
    const messageElement = document.getElementById("mensagem");

    const urlParams = new URLSearchParams(window.location.search);
    let usuarioDoPerfil = urlParams.get("user") || usuarioSessaoAlvo;

    if (!usuarioDoPerfil) {
        const nomePerfilElemento = document.getElementById("nome-perfil");
        if (nomePerfilElemento) {
            usuarioDoPerfil = nomePerfilElemento.textContent.replace("Usuário: ", "").replace("Perfil de ", "").trim();
        }
    }

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/amizades/enviar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_remetente: usuarioSessao, id_destinatario: usuarioDoPerfil })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            if (messageElement) {
                messageElement.style.color = "#00ff00";
                messageElement.textContent = dados.mensagem || "Pedido de amizade enviado!";
            } else {
                alert(dados.mensagem || "Pedido de amizade enviado!");
            }
            if (btnAmigo) {
                btnAmigo.style.opacity = "0.5";
                btnAmigo.disabled = true;
            }
        } else {
            if (messageElement) {
                messageElement.style.color = "#e5151a";
                messageElement.textContent = dados.erro || dados.mensagem || "Erro ao enviar pedido.";
            } else {
                alert(dados.erro || dados.mensagem || "Erro ao enviar pedido.");
            }
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}

// 5. DESFAZER AMIZADE
async function desfazerAmizade() {
    if (!confirm(`Deseja realmente desfazer a sua amizade com @${usuarioSessaoAlvo}?`)) return;

    try {
        const resposta = await fetch(`${URL_SERVIDOR}/amizades/desfazer`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_logado: usuarioSessao, usuario_perfil: usuarioSessaoAlvo })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem || "Amizade desfeita!");
            window.location.reload();
        } else {
            alert(dados.erro || "Não foi possível remover o amigo.");
        }
    } catch (erro) {
        console.error("Erro ao processar remoção de amizade:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}

document.addEventListener("DOMContentLoaded", carregarPerfil);
