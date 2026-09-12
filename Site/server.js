const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();

// ==========================================
// CAMADA DE SEGURANÇA
// ==========================================

// 1. Oculta a tecnologia do servidor
app.disable("x-powered-by");

// 2. Cabeçalhos de segurança contra XSS e Clickjacking
app.use(
    helmet({
        contentSecurityPolicy: false, // Permite carregar seus scripts e estilos locais sem conflito
        crossOriginEmbedderPolicy: false
    })
);

// 3. Limite de tamanho no corpo das requisições (proteção contra DoS)
app.use(express.json({ limit: "100kb" }));

// 4. Rate Limiting geral (proteção contra sobrecarga)
const limiterGeral = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Limite de 300 requisições por IP a cada 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: "Muitas requisições vindas deste IP. Tente novamente mais tarde." }
});
app.use(limiterGeral);

// 5. Rate Limiting específico para Login (proteção contra força bruta)
const limiterLogin = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, // Máximo de 10 tentativas a cada 10 min
    message: { mensagem: "Muitas tentativas de login incorretas. Aguarde 10 minutos." }
});

// 6. Rate Limiting para Criação de Contas (proteção contra spam de robôs)
const limiterRegistro = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Máximo de 10 cadastros por IP por hora
    message: { sucesso: false, mensagem: "Limite de criação de contas atingido. Tente novamente mais tarde." }
});

// Arquivos estáticos
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// CONEXÃO COM O BANCO DE DADOS
// ==========================================
const conexao = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "furia_db"
});

conexao.connect((erro) => {
    if (erro) {
        console.error("Erro ao conectar ao MySQL:", erro.message);
        return;
    }
    console.log("Conectado ao MySQL!");
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post("/login", limiterLogin, (req, res) => {
    const { usuario, senha } = req.body;
    
    if (!usuario || !senha) {
        return res.status(400).json({ mensagem: "Usuario e senha são obrigatórios." });
    }

    const sql = "SELECT * FROM usuarios WHERE usuario = ?";

    conexao.query(sql, [usuario], async (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ mensagem: "Erro no servidor." });
        }
        if (!resultados || resultados.length === 0) {
            return res.status(401).json({ mensagem: "Usuario ou Senha incorretos" });
        }
        
        const usuarioEncontrado = resultados[0];
        const senhaCorreta = await bcrypt.compare(senha, usuarioEncontrado.senha);
        
        if (!senhaCorreta) {
            return res.status(401).json({ report: "Usuario ou Senha incorretos." });
        }
        res.json({ mensagem: "Login realizado com sucesso!" });
    });
});

app.post("/registro", limiterRegistro, async (req, res) => {
    const { usuario, senha, email } = req.body;

    if (!usuario || !senha || !email) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos: usuário, e-mail e senha."
        });
    }

    // Validação mínima de segurança da senha
    if (typeof senha !== "string" || senha.length < 6) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "A senha deve ter pelo menos 6 caracteres."
        });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const sql = "INSERT INTO usuarios (usuario, email, senha) VALUES (?, ?, ?)";

        conexao.query(sql, [usuario, email, senhaHash], (erro) => {
            if (erro) {
                if (erro.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        sucesso: false,
                        mensagem: "Este nome de usuário ou e-mail já existe."
                    });
                }
                console.log(erro);
                return res.json({
                    sucesso: false,
                    mensagem: "Erro ao criar a conta."
                });
            }
            res.json({
                sucesso: true,
                mensagem: "Conta criada com sucesso! Agora voce pode entrar."
            });
        });
    } catch (erro) {
        console.log("Erro no bcrypt:", erro);
        return res.json({
            sucesso: false,
            mensagem: "Erro ao proteger a senha."
        });
    }
});

app.post("/suporte", (req, res) => {
    const { usuario, comentario } = req.body;

    if (!usuario || !comentario) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Usuario e comentario são obrigatorios."
        });
    }
    const sql = "INSERT INTO suportes (usuario, comentario) VALUES(?, ?)";

    conexao.query(sql, [usuario, comentario], (erro) => {
        if (erro) {
            console.log("Erro ao salvar suporte:", erro);
            return res.status(500).json({
                mensagem: "Não foi possivel enviar o comentario."
            });
        }
        return res.json({
            sucesso: true,
            mensagem: "Comentario enviado ao suporte com sucesso!"
        });
    });
});

// ==========================================
// CONFIGURAÇÃO SEGURA DE UPLOADS
// ==========================================
const pastaUploads = path.join(__dirname, "uploads");
if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaUploads);
    },
    filename: (req, file, cb) => {
        // Gera um nome único aleatório e preserva a extensão de forma segura
        const extensaoSegura = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
        const nomeAleatorio = crypto.randomBytes(16).toString("hex") + "-" + Date.now() + extensaoSegura;
        cb(null, nomeAleatorio);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite estrito de 5MB
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Envie apenas arquivos de imagem permitidos (JPEG, PNG, WEBP ou GIF)."));
        }
    }
});

// Middleware para capturar erros de upload de forma amigável
const uploadSeguro = (campo) => (req, res, next) => {
    const middleware = upload.single(campo);
    middleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ sucesso: false, mensagem: "A imagem não pode ultrapassar 5MB." });
            }
            return res.status(400).json({ sucesso: false, mensagem: err.message });
        } else if (err) {
            return res.status(400).json({ sucesso: false, mensagem: err.message });
        }
        next();
    });
};

// ==========================================
// ROTAS DE PERFIL E POSTAGENS
// ==========================================
app.post("/perfil", uploadSeguro("foto"), async (req, res) => {
    const { usuario, email, dataNascimento, biografia } = req.body;

    if (!usuario) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Usuário não identificado."
        });
    }

    if (biografia && biografia.length > 500) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "A biografia pode ter no máximo 500 caracteres."
        });
    }

    let nomeFoto = null;

    if (req.file) {
        try {
            const imagem = sharp(req.file.path);
            const dadosImagem = await imagem.metadata();

            if (dadosImagem.width !== 320 || dadosImagem.height !== 320) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "A foto precisa ter exatamente 320 x 320 pixels."
                });
            }

            nomeFoto = req.file.filename;
        } catch (erro) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Não foi possível ler essa imagem."
            });
        }
    }

    const sql = `
        INSERT INTO perfis (usuario, email, data_nascimento, biografia, foto)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            data_nascimento = VALUES(data_nascimento),
            biografia = VALUES(biografia),
            foto = IF(VALUES(foto) IS NULL, foto, VALUES(foto))
    `;

    conexao.query(
        sql,
        [usuario, email, dataNascimento || null, biografia, nomeFoto],
        (erro) => {
            if (erro) {
                console.log("Erro ao salvar perfil:", erro);
                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao salvar o perfil."
                });
            }
            return res.json({
                sucesso: true,
                mensagem: "Perfil salvo com sucesso!"
            });
        }
    );
});

app.get("/perfil", (req, res) => {
    const { usuario } = req.query;

    if (!usuario) {
        return res.status(400).json({ mensagem: "Usuário não informado." });
    }

    const sql = "SELECT * FROM perfis WHERE usuario = ?";
    conexao.query(sql, [usuario], (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar perfil:", erro);
            return res.status(500).json({ mensagem: "Erro no servidor ao buscar perfil." });
        }
        
        if (resultados.length === 0) {
            return res.json({ mensagem: "Perfil não configurado." });
        }

        res.json(resultados);
    });
});

app.get("/postagens", (req, res) => {
    const sqlPostagens = "SELECT * FROM postagens ORDER BY criado_em DESC";
    
    conexao.query(sqlPostagens, (erro, postagens) => {
        if (erro) return res.status(500).json({ mensagem: "Erro ao buscar postagens." });
        
        if (postagens.length === 0) {
            return res.json([]);
        }

        const sqlComentarios = "SELECT * FROM comentarios ORDER BY criado_em ASC";
        
        conexao.query(sqlComentarios, (erroCom, comentarios) => {
            if (erroCom) return res.status(500).json({ mensagem: "Erro ao buscar comentários." });

            const postagensMapeadas = postagens.map(post => {
                post.comentarios = comentarios.filter(c => c.post_id === post.id);
                return post;
            });

            res.json(postagensMapeadas);
        });
    });
});

app.post("/postagens", uploadSeguro("foto"), (req, res) => {
    const { usuario, titulo, conteudo } = req.body;
    
    if (!usuario || !titulo || !conteudo) {
        return res.status(400).json({ mensagem: "Preencha todos os campos." });
    }
    
    const nomeFoto = req.file ? req.file.filename : null;
    const sql = "INSERT INTO postagens (usuario, titulo, conteudo, foto) VALUES (?, ?, ?, ?)";
    
    conexao.query(sql, [usuario, titulo, conteudo, nomeFoto], (erro) => {
        if (erro) return res.status(500).json({ mensagem: "Erro ao salvar postagem." });
        res.json({ mensagem: "Postagem publicada com sucesso!" });
    });
});

app.delete("/postagens/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM postagens WHERE id = ?";

    conexao.query(sql, [id], (erro, resultado) => {
        if (erro) return res.status(500).json({ mensagem: "Erro ao excluir postagem." });
        res.json({ mensagem: "Postagem excluída com sucesso!" });
    });
});

app.put("/postagens/:id", (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo } = req.body;

    if (!titulo || !conteudo) {
        return res.status(400).json({ mensagem: "Título e conteúdo não podem ser vazios." });
    }

    const sql = "UPDATE postagens SET titulo = ?, conteudo = ? WHERE id = ?";

    conexao.query(sql, [titulo, conteudo, id], (erro, resultado) => {
        if (erro) return res.status(500).json({ mensagem: "Erro ao atualizar postagem." });
        res.json({ mensagem: "Postagem atualizada com sucesso!" });
    });
});

// ==========================================
// ROTAS DE AMIZADE
// ==========================================
app.post("/amizades/enviar", (req, res) => {
    const { id_remetente, id_destinatario } = req.body;

    if (!id_remetente || !id_destinatario) {
        return res.status(400).json({ erro: "Remetente e destinatário são obrigatórios." });
    }

    if (id_remetente === id_destinatario) {
        return res.status(400).json({ erro: "Você não pode enviar um pedido de amizade para si mesmo." });
    }

    const sqlBuscarIds = "SELECT id, usuario FROM usuarios WHERE usuario = ? OR usuario = ?";
    conexao.query(sqlBuscarIds, [id_remetente, id_destinatario], (errBusca, usuarios) => {
        if (errBusca) {
            console.error(errBusca);
            return res.status(500).json({ erro: "Erro ao buscar dados dos usuários." });
        }

        const usuarioRemetente = usuarios.find(u => u.usuario === id_remetente);
        const usuarioDestinatario = usuarios.find(u => u.usuario === id_destinatario);

        if (!usuarioRemetente || !usuarioDestinatario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const realIdRemetente = usuarioRemetente.id;
        const realIdDestinatario = usuarioDestinatario.id;

        const sqlVerificar = "SELECT * FROM amizades WHERE (id_remetente = ? AND id_destinatario = ?) OR (id_remetente = ? AND id_destinatario = ?)";
        conexao.query(sqlVerificar, [realIdRemetente, realIdDestinatario, realIdDestinatario, realIdRemetente], (errVerificar, resultados) => {
            if (errVerificar) {
                console.error(errVerificar);
                return res.status(500).json({ erro: "Erro ao verificar solicitações anteriores." });
            }

            if (resultados.length > 0) {
                return res.status(400).json({ erro: "Já existe um pedido de amizade pendente ou ativo entre vocês." });
            }

            const sqlInserir = "INSERT INTO amizades (id_remetente, id_destinatario, status) VALUES (?, ?, 'pendente')";
            conexao.query(sqlInserir, [realIdRemetente, realIdDestinatario], (errInserir) => {
                if (errInserir) {
                    console.error(errInserir);
                    return res.status(500).json({ erro: "Erro ao registrar pedido de amizade." });
                }

                return res.json({ mensagem: "Solicitação de amizade enviada com sucesso!" });
            });
        });
    });
});

app.get("/buscar", (req, res) => {
    const termo = req.query.q;
    if (!termo) {
        return res.status(400).json({ erro: "Digite algo para buscar." });
    }

    const termoBusca = `%${termo}%`;
    const sqlFeed = "SELECT 'postagem' AS tipo, id, usuario AS resultado_titulo, titulo AS resultado_subtitulo FROM postagens WHERE titulo LIKE ? OR conteudo LIKE ?";
    const sqlUsuarios = "SELECT 'usuario' AS tipo, id, usuario AS resultado_titulo, NULL AS resultado_subtitulo FROM usuarios WHERE usuario LIKE ?";
    const sqlSuporte = "SELECT 'suporte' AS tipo, id, usuario AS resultado_titulo, comentario AS resultado_subtitulo FROM suportes WHERE usuario LIKE ? OR comentario LIKE ?";
    
    const sqlUnificado = `${sqlFeed} UNION ${sqlUsuarios} UNION ${sqlSuporte}`;

    conexao.query(sqlUnificado, [termoBusca, termoBusca, termoBusca, termoBusca, termoBusca], (erro, resultados) => {
        if (erro) {
            console.error("Erro interno ao realizar busca:", erro);
            return res.status(500).json({ erro: "Erro interno ao realizar a busca no banco de dados." });
        }
        res.json(resultados);
    });
});

app.get("/amizades/pendentes", (req, res) => {
    const { usuario } = req.query;
    if (!usuario) {
        return res.status(400).json({ erro: "Usuário não informado." });
    }

    const sql = `
        SELECT a.id, u.usuario AS remetente  
        FROM amizades a 
        JOIN usuarios u ON a.id_remetente = u.id 
        WHERE a.id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?) AND a.status = 'pendente'
    `;

    conexao.query(sql, [usuario], (erro, resultados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({ erro: "Erro ao buscar solicitações." });
        }
        res.json(resultados);
    });
});

app.post("/amizades/responder", (req, res) => {
    const { id_solicitacao, acao } = req.body;
    if (!id_solicitacao || !['aceito', 'recusado'].includes(acao)) {
        return res.status(400).json({ erro: "Dados inválidos." });
    }

    const sql = "UPDATE amizades SET status = ? WHERE id = ?";
    conexao.query(sql, [acao, id_solicitacao], (erro) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({ erro: "Erro ao responder solicitação." });
        }
        res.json({ mensagem: `Pedido de amizade ${acao === 'aceito' ? 'aceito' : 'recusado'} com sucesso!` });
    });
});

app.get("/amizades/lista", (req, res) => {
    const { usuario } = req.query;
    if (!usuario) {
        return res.status(400).json({ erro: "Usuário não informado." });
    }

    const sql = `
        SELECT u.usuario AS nome_amigo  
        FROM amizades a 
        JOIN usuarios u ON (a.id_remetente = u.id OR a.id_destinatario = u.id) 
        WHERE (a.id_remetente = (SELECT id FROM usuarios WHERE usuario = ?)  OR a.id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?)) 
          AND a.status = 'aceito' AND u.usuario != ?
    `;

    conexao.query(sql, [usuario, usuario, usuario], (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar lista de amigos:", erro);
            return res.status(500).json({ erro: "Erro ao buscar lista de amigos." });
        }
        res.json(resultados);
    });
});

app.get("/amizades/status", (req, res) => {
    const { usuario_logado, usuario_perfil } = req.query;
    if (!usuario_logado || !usuario_perfil) {
        return res.status(400).json({ erro: "Usuários não informados." });
    }

    const sql = `
        SELECT status FROM amizades  
        WHERE (id_remetente = (SELECT id FROM usuarios WHERE usuario = ?) AND id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?)) 
           OR (id_remetente = (SELECT id FROM usuarios WHERE usuario = ?) AND id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?))
    `;

    conexao.query(sql, [usuario_logado, usuario_perfil, usuario_perfil, usuario_logado], (erro, resultados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({ erro: "Erro ao checar amizade." });
        }
        if (resultados.length > 0) {
            return res.json({ status: resultados[0].status });
        }
        res.json({ status: "nenhum" });
    });
});

app.delete("/amizades/desfazer", (req, res) => {
    const { usuario_logado, usuario_perfil } = req.body;
    if (!usuario_logado || !usuario_perfil) {
        return res.status(400).json({ erro: "Usuários não informados." });
    }

    const sql = `
        DELETE FROM amizades  
        WHERE (id_remetente = (SELECT id FROM usuarios WHERE usuario = ?) AND id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?)) 
           OR (id_remetente = (SELECT id FROM usuarios WHERE usuario = ?) AND id_destinatario = (SELECT id FROM usuarios WHERE usuario = ?))
    `;

    conexao.query(sql, [usuario_logado, usuario_perfil, usuario_perfil, usuario_logado], (erro, resultado) => {
        if (erro) {
            console.error("Erro ao desfazer amizade:", erro);
            return res.status(500).json({ erro: "Erro ao processar a remoção no servidor." });
        }
        res.json({ mensagem: "Amizade desfeita com sucesso!" });
    });
});

// ==========================================
// ROTAS DE MENSAGENS E CHAT
// ==========================================
app.post("/mensagens/marcar-lidas", (req, res) => {
    const { remetente, destinatario } = req.body;
    if (!remetente || !destinatario) {
        return res.status(400).json({ erro: "Dados incompletos para marcar como lida." });
    }
    const sql = "UPDATE mensagens SET lida = 1 WHERE remetente = ? AND destinatario = ? AND lida = 0";
    conexao.query(sql, [remetente, destinatario], (erro, resultado) => {
        if (erro) {
            console.error("Erro ao atualizar status de leitura:", erro);
            return res.status(500).json({ erro: "Erro ao atualizar leitura no banco." });
        }
        res.json({ sucesso: true, alterados: resultado.affectedRows });
    });
});

app.get("/mensagens/historico", (req, res) => {
    const { remetente, destinatario } = req.query;
    if (!remetente || !destinatario) {
        return res.status(400).json({ erro: "Usuários não informados." });
    }

    const sql = `
        SELECT id, remetente, destinatario, conteudo, lida, criado_em  
        FROM mensagens  
        WHERE (remetente = ? AND destinatario = ?)  
           OR (remetente = ? AND destinatario = ?)  
        ORDER BY id ASC
    `;

    conexao.query(sql, [remetente, destinatario, destinatario, remetente], (erro, resultados) => {
        if (erro) {
            console.error("Erro ao buscar histórico:", erro);
            return res.status(500).json({ erro: "Erro ao carregar mensagens." });
        }
        res.json(resultados);
    });
});

app.get("/mensagens/nao-lidas", (req, res) => {
    const { usuario } = req.query;
    if (!usuario) return res.status(400).json({ erro: "Usuário não informado." });

    const sql = `
        SELECT remetente, COUNT(*) AS total  
        FROM mensagens  
        WHERE destinatario = ? AND lida = 0  
        GROUP BY remetente
    `;

    conexao.query(sql, [usuario], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json(resultados);
    });
});

app.post("/mensagens/enviar", (req, res) => {
    const { remetente, destinatario, conteudo } = req.body;
    if (!remetente || !destinatario || !conteudo || !conteudo.trim()) {
        return res.status(400).json({ erro: "Dados inválidos para envio." });
    }
    const sql = "INSERT INTO mensagens (remetente, destinatario, conteudo, lida) VALUES (?, ?, ?, 0)";
    conexao.query(sql, [remetente.trim(), destinatario.trim(), conteudo.trim()], (erro) => {
        if (erro) {
            console.error("Erro ao salvar mensagem no MySQL:", erro);
            return res.status(500).json({ erro: "Erro ao enviar mensagem." });
        }
        res.json({ sucesso: true, mensagem: "Mensagem enviada!" });
    });
});

// ==========================================
// ROTAS DE CURTIDAS E COMENTÁRIOS
// ==========================================
app.post("/postagens/:id/curtir", (req, res) => {
    const idPost = req.params.id;
    const { usuario } = req.body;

    if (!usuario) {
        return res.status(400).json({ erro: "Usuário não identificado." });
    }

    const sqlVerificar = "SELECT * FROM curtidas_controle WHERE post_id = ? AND usuario = ?";
    
    conexao.query(sqlVerificar, [idPost, usuario], (erroVerifica, resultados) => {
        if (erroVerifica) {
            console.error("Erro ao verificar curtida:", erroVerifica);
            return res.status(500).json({ erro: "Erro ao processar verificação." });
        }

        if (resultados && resultados.length > 0) {
            const sqlRemoverControle = "DELETE FROM curtidas_controle WHERE post_id = ? AND usuario = ?";
            conexao.query(sqlRemoverControle, [idPost, usuario], (erroRemove) => {
                if (erroRemove) return res.status(500).json({ erro: "Erro ao remover registro." });

                const sqlSubtrair = "UPDATE postagens SET curtidas = GREATEST(0, curtidas - 1) WHERE id = ?";
                conexao.query(sqlSubtrair, [idPost], () => {
                    conexao.query("SELECT curtidas FROM postagens WHERE id = ?", [idPost], (e, dados) => {
                        if (e || !dados || dados.length === 0) return res.status(500).json({ erro: "Erro" });
                        
                        const totalCurtidas = dados[0].curtidas || 0;
                        return res.json({ curtidas: totalCurtidas, curtiu: false });
                    });
                });
            });

        } else {
            const sqlInserirControle = "INSERT INTO curtidas_controle (post_id, usuario) VALUES (?, ?)";
            conexao.query(sqlInserirControle, [idPost, usuario], (erroInsere) => {
                if (erroInsere) return res.status(500).json({ erro: "Erro ao salvar registro de curtida." });

                const sqlSomar = "UPDATE postagens SET curtidas = curtidas + 1 WHERE id = ?";
                conexao.query(sqlSomar, [idPost], () => {
                    conexao.query("SELECT curtidas FROM postagens WHERE id = ?", [idPost], (e, dados) => {
                        if (e || !dados || dados.length === 0) return res.status(500).json({ erro: "Erro" });
                        
                        const totalCurtidas = dados[0].curtidas || 0;
                        return res.json({ curtidas: totalCurtidas, curtiu: true });
                    });
                });
            });
        }
    });
});

app.post("/postagens/:id/comentar", (req, res) => {
    const idPost = req.params.id;
    const { usuario, conteudo } = req.body;

    if (!usuario || !conteudo) {
        return res.status(400).json({ erro: "Usuário e conteúdo são obrigatórios." });
    }

    const query = "INSERT INTO comentarios (post_id, usuario, conteudo) VALUES (?, ?, ?)";
    
    conexao.query(query, [idPost, usuario, conteudo], (erro, resultado) => {
        if (erro) {
            console.error("Erro ao inserir comentário no banco:", erro);
            return res.status(500).json({ erro: "Erro ao salvar comentário." });
        }
        
        res.json({ mensagem: "Comentário enviado com sucesso!" });
    });
});

app.delete("/comentarios/:id", (req, res) => {
    const idComentario = req.params.id;
    const sql = "DELETE FROM comentarios WHERE id = ?";

    conexao.query(sql, [idComentario], (erro, resultado) => {
        if (erro) {
            console.error("Erro no MySQL ao excluir comentário:", erro);
            return res.status(500).json({ mensagem: "Erro ao excluir comentário no banco." });
        }
        res.json({ mensagem: "Comentário excluído com sucesso!" });
    });
});

app.put("/comentarios/:id", (req, res) => {
    const idComentario = req.params.id;
    const { conteudo } = req.body;

    if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ mensagem: "O conteúdo não pode ser vazio." });
    }

    const sql = "UPDATE comentarios SET conteudo = ? WHERE id = ?";

    conexao.query(sql, [conteudo.trim(), idComentario], (erro, resultado) => {
        if (erro) {
            console.error("Erro no MySQL ao editar comentário:", erro);
            return res.status(500).json({ mensagem: "Erro ao atualizar comentário no banco." });
        }
        res.json({ mensagem: "Comentário atualizado com sucesso!" });
    });
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
