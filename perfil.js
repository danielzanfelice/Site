const URL_SERVIDOR = "https://sitefuria.onrender.com";
const usuarioSessao = localStorage.getItem("furiaUsuario") || localStorage.getItem("usuarioLogado") || "";
const urlParams = new URLSearchParams(window.location.search);
const usuarioUrl = urlParams.get("user");
const usuarioSessaoAlvo = usuarioUrl ? usuarioUrl : usuarioSessao;
const chavePerfilUsuario = "furiaPerfil_" + usuarioSessaoAlvo;
const chaveFotoUsuario = "furiaFoto_" + usuarioSessaoAlvo;



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

    nomeFoto.textContent = input.files && input.files[0]
        ? input.files[0].name
        : "Nenhum arquivo escolhido";
}


function salvarPerfil() {
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
// --- ENVIO DOS DADOS PARA O BANCO DE DADOS NA RENDER ---
    const formData = new FormData();
    formData.append("usuario", usuarioSessao); // Usa a variável que você já tem na linha 3
    formData.append("email", email.value);
    formData.append("dataNascimento", nascimento.value);
    formData.append("biografia", bio.value);
    
    // Verifica se o usuário selecionou uma nova foto antes de enviar
    if (foto.files && foto.files[0]) {
        formData.append("foto", foto.files[0]);
    }

    fetch(`${URL_SERVIDOR}/perfil`, {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(dados => {
        if (!dados.sucesso) {
            console.error("Aviso do servidor:", dados.mensagem);
        }
    })
    .catch(err => console.error("Erro ao conectar com a Render:", err));
    // -------------------------------------------------------
    if (foto && foto.files && foto.files[0]) {
        const leitor = new FileReader();

        leitor.onload = function(evento) {
            // Salva na gaveta exclusiva do usuário ativo
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
    }
}

async function atualizarIconeAmizadeVisual(btnAmigo) {
    if (!btnAmigo || usuarioSessaoAlvo === usuarioSessao) return;

    try {
        const resposta = await fetch(`/amizades/lista?usuario=${usuarioSessao}`);
        if (!resposta.ok) return;

        const amigos = await resposta.json();
        
        const jaSaoAmigos = amigos.some(function(amigo) {
            return String(amigo.nome_amigo).trim() === String(usuarioSessaoAlvo).trim();
        });

        if (jaSaoAmigos) {
            btnAmigo.style.borderColor = "#00ff00";
            btnAmigo.style.color = "#00ff00";
            btnAmigo.disabled = false; 
            btnAmigo.title = "Clique para desfazer amizade";
            btnAmigo.setAttribute("onclick", "desfazerAmizade()");
            btnAmigo.innerHTML = `
                <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="15 14 18 17 22 12" stroke="#00ff00"></polyline>
                </svg>
            `;
        }
    } catch (erro) {
        console.error(erro);
    }
}

function carregarPerfil() {
    // 1. Lê quem está na URL e quem está logado
    const params = new URLSearchParams(window.location.search);
    const usuarioUrl = params.get("user");
    const meuUsuario = localStorage.getItem("furiaUsuario") || localStorage.getItem("usuarioLogado") || "";

    // Se tiver ?user= na URL, o alvo é o amigo; se não, sou eu mesmo
    const usuarioAlvo = usuarioUrl ? usuarioUrl : meuUsuario;
    const ehProprioPerfil = !usuarioUrl || (usuarioUrl.toLowerCase() === meuUsuario.toLowerCase());

    // 2. Atualiza o título grande (h1) e o nome do usuário
    const tituloPerfil = document.getElementById("titulo-perfil");
    const textoNomeUsuario = document.getElementById("usuario-nome-texto");
    const nomeNav = document.getElementById("nome-perfil");

    if (tituloPerfil) {
        tituloPerfil.textContent = ehProprioPerfil ? "Meu perfil" : "Perfil de " + usuarioAlvo;
    }
    if (textoNomeUsuario) {
        textoNomeUsuario.textContent = usuarioAlvo;
    }
    if (nomeNav && meuUsuario) {
        nomeNav.textContent = meuUsuario;
    }

    // 3. Lê os dados do perfil desse usuário específico
    const chavePerfil = "furiaPerfil_" + usuarioAlvo;
    const perfil = JSON.parse(localStorage.getItem(chavePerfil) || "{}");

    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const avatar = document.getElementById("avatar");
    const btnAmigo = document.getElementById("btn-adicionar-amigo");
    const btnSalvar = document.querySelector(".btn-principal");
    const campoFoto = document.getElementById("foto");
    const nomeFoto = document.getElementById("nome-foto-perfil");

    if (email) email.value = perfil.email || "";
    if (nascimento) nascimento.value = perfil.nascimento || "";
    if (bio) bio.value = perfil.bio || "";
    if (typeof contadorBio === "function") contadorBio();

    // 4. Foto do perfil
    const foto = localStorage.getItem("furiaFoto_" + usuarioAlvo);
    if (avatar && foto) {
        avatar.innerHTML = `<img src="${foto}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else if (avatar) {
        avatar.innerHTML = `<img src="avatar-padrao.png" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }

    // 5. Se for o perfil de outra pessoa: esconde botão de salvar e bloqueia edição
    if (!ehProprioPerfil) {
        if (btnSalvar) btnSalvar.style.display = "none";
        if (campoFoto) campoFoto.style.display = "none";
        if (nomeFoto) nomeFoto.style.display = "none";
        if (email) email.disabled = true;
        if (nascimento) nascimento.disabled = true;
        if (bio) bio.disabled = true;
        if (btnAmigo) btnAmigo.style.display = "flex";
    } else {
        if (btnSalvar) btnSalvar.style.display = "block";
        if (campoFoto) campoFoto.style.display = "block";
        if (nomeFoto) nomeFoto.style.display = "inline";
        if (email) email.disabled = false;
        if (nascimento) nascimento.disabled = false;
        if (bio) bio.disabled = false;
        if (btnAmigo) btnAmigo.style.display = "none";
    }
}

// Executa ao carregar a página
document.addEventListener("DOMContentLoaded", carregarPerfil);



async function enviarPedidoAmizade() {
    const usuarioLogado = localStorage.getItem("furiaUsuario");
    const btnAmigo = document.getElementById("btn-adicionar-amigo");
    const messageElement = document.getElementById("mensagem");

    const urlParams = new URLSearchParams(window.location.search);
    let usuarioDoPerfil = urlParams.get("user");

    if (!usuarioDoPerfil) {
        const nomePerfilElemento = document.getElementById("nome-perfil");
        if (nomePerfilElemento) {
            usuarioDoPerfil = nomePerfilElemento.textContent.replace("Usuário: ", "").trim();
        }
    }

    try {
        const resposta = await fetch("/amizades/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_remetente: usuarioLogado, id_destinatario: usuarioDoPerfil })
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
                messageElement.textContent = dados.erro;
            } else {
                alert(dados.erro);
            }
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}


async function desfazerAmizade() {
    if (!confirm(`Deseja realmente desfazer a sua amizade com @${usuarioSessaoAlvo}?`)) return;
    try {
        const resposta = await fetch("/amizades/desfazer", {
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
        console.error("Erro ao processar removal de amizade:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}
