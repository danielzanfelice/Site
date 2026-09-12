
const usuarioSessao = localStorage.getItem("furiaUsuario") || "daniel";
const urlParams = new URLSearchParams(window.location.search);
const usuarioURL = urlParams.get("user");
const usuarioSessaoAlvo = usuarioURL ? usuarioURL.trim() : usuarioSessao;
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
    // Lê estritamente os dados vinculados à chave isolada do usuário alvo atual
    const dadosLocais = localStorage.getItem(chavePerfilUsuario);
    const perfil = JSON.parse(dadosLocais || "{}");

    const email = document.getElementById("email");
    const nascimento = document.getElementById("nascimento");
    const bio = document.getElementById("bio");
    const avatar = document.getElementById("avatar");
    const btnAmigo = document.getElementById("btn-adicionar-amigo");

    if (email) email.value = perfil.email || "";
    if (nascimento) nascimento.value = perfil.nascimento || "";
    if (bio) bio.value = perfil.bio || "";

    contadorBio();

    
    const foto = localStorage.getItem(chaveFotoUsuario);

    if (avatar && foto) {
        avatar.innerHTML = `
            <img src="${foto}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        `;
    } else if (avatar) {
        
        avatar.innerHTML = `
            <img src="avatar-padrao.png" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        `;
    }

    const nomePerfil = document.getElementById("nome-perfil");
    if (nomePerfil) {
        nomePerfil.textContent = (usuarioSessaoAlvo === usuarioSessao) ? "Meu perfil" : "Perfil de " + usuarioSessaoAlvo;
    }

    const textoNomeUsuario = document.getElementById("usuario-nome-texto");
    if (textoNomeUsuario) {
        textoNomeUsuario.textContent = usuarioSessaoAlvo;
    }

    if (btnAmigo) {
        if (usuarioSessaoAlvo === usuarioSessao) {
            btnAmigo.style.display = "none";
        } else {
            btnAmigo.style.display = "flex";
            btnAmigo.disabled = false;
            btnAmigo.style.borderColor = "#e5151a";
            btnAmigo.style.color = "#ffffff";
            btnAmigo.setAttribute("onclick", "enviarPedidoAmizade()");
            btnAmigo.innerHTML = `
                <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <circle cx="18" cy="14" r="5" stroke="#e5151a"></circle>
                    <line x1="18" y1="11" x2="18" y2="17" stroke="#e5151a"></line>
                    <line x1="15" y1="14" x2="21" y2="14" stroke="#e5151a"></line>
                </svg>
            `;
            atualizarIconeAmizadeVisual(btnAmigo);
        }
    }

    if (usuarioSessaoAlvo !== usuarioSessao) {
        if (email) email.disabled = true;
        if (nascimento) nascimento.disabled = true;
        if (bio) bio.disabled = true;
        
        const btnSalvar = document.querySelector(".btn-principal");
        if (btnSalvar) btnSalvar.style.display = "none";
        
        const inputFoto = document.getElementById("foto");
        if (inputFoto) inputFoto.style.display = "none";
    }
}

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
