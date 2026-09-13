-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 13/09/2026 às 00:21
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `furia_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `amizades`
--

CREATE TABLE `amizades` (
  `id` int(11) NOT NULL,
  `id_remetente` int(11) NOT NULL,
  `id_destinatario` int(11) NOT NULL,
  `status` enum('pendente','aceito','recusado') DEFAULT 'pendente',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `amizades`
--

INSERT INTO `amizades` (`id`, `id_remetente`, `id_destinatario`, `status`, `criado_em`) VALUES
(6, 7, 8, 'aceito', '2026-09-12 04:33:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `conteudo` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curtidas_controle`
--

CREATE TABLE `curtidas_controle` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagens`
--

CREATE TABLE `mensagens` (
  `id` int(11) NOT NULL,
  `remetente` varchar(255) NOT NULL,
  `destinatario` varchar(255) NOT NULL,
  `conteudo` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `lida` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `mensagens`
--

INSERT INTO `mensagens` (`id`, `remetente`, `destinatario`, `conteudo`, `criado_em`, `lida`) VALUES
(1, 'daniel', 'ana', 'alo alo', '2026-09-08 19:33:40', 1),
(2, 'ana', 'daniel', 'oi oi', '2026-09-08 19:37:17', 1),
(3, 'ana', 'daniel', 'oiiiii', '2026-09-08 19:37:50', 1),
(4, 'daniel', 'ana', 'tudo bem?', '2026-09-08 19:38:43', 1),
(5, 'daniel', 'ana', 'oiiii', '2026-09-08 19:39:04', 1),
(6, 'ana', 'daniel', 'tudo sim e vc?', '2026-09-08 19:42:24', 1),
(7, 'daniel', 'ana', 'to sim', '2026-09-08 19:48:53', 1),
(8, 'ana', 'daniel', 'que bomm', '2026-09-08 19:58:23', 1),
(9, 'daniel', 'ana', 'oii', '2026-09-08 20:04:14', 1),
(10, 'daniel', 'ana', 'zzzz', '2026-09-08 20:06:36', 1),
(11, 'ana', 'daniel', 'OIII', '2026-09-08 20:19:54', 1),
(12, 'ana', 'daniel', 'alo dani', '2026-09-08 21:01:09', 1),
(13, 'daniel', 'ana', 'sssssss', '2026-09-09 09:44:53', 1),
(14, 'ana', 'daniel', 'asdasdasd', '2026-09-09 09:45:20', 1),
(15, 'ana', 'daniel', 'sasaasas', '2026-09-09 09:45:45', 1),
(16, 'daniel', 'ana', 'sadasdasdasd', '2026-09-11 03:12:41', 1),
(17, 'daniel', 'ana', 'asdasdasda', '2026-09-12 04:15:43', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `perfis`
--

CREATE TABLE `perfis` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `biografia` varchar(500) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `perfis`
--

INSERT INTO `perfis` (`id`, `usuario`, `email`, `data_nascimento`, `biografia`, `foto`) VALUES
(1, 'daniel', 'danielzanfelice@gmail.com', '1998-09-17', 'sasaasas', '1788887216290-imagem_320x320.jpg');

-- --------------------------------------------------------

--
-- Estrutura para tabela `postagens`
--

CREATE TABLE `postagens` (
  `id` int(11) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `conteudo` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` varchar(255) DEFAULT NULL,
  `curtidas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `suportes`
--

CREATE TABLE `suportes` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `comentario` varchar(500) NOT NULL,
  `data_envio` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `usuario`, `email`, `senha`) VALUES
(1, 'root@localhost', '', '*A4B6157319038724E3560894F7F932C8886EBFCF'),
(2, '[value-2]', '', '[value-3]'),
(7, 'daniel', '', '$2b$10$fj/cYdWoh6wc/rnfBr/pC.d./K7m1TI98QC5BVBcaWvy7q/94tCfu'),
(8, 'ana', '', '$2b$10$2c/D/y4xGi4k8PzAF3/Ep.ZylIhITGsLQURU8WtXH70YAwgmXsEma');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `amizades`
--
ALTER TABLE `amizades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `amizade_unica` (`id_remetente`,`id_destinatario`),
  ADD KEY `id_destinatario` (`id_destinatario`);

--
-- Índices de tabela `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_id` (`post_id`);

--
-- Índices de tabela `curtidas_controle`
--
ALTER TABLE `curtidas_controle`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unica_curtida` (`post_id`,`usuario`);

--
-- Índices de tabela `mensagens`
--
ALTER TABLE `mensagens`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `perfis`
--
ALTER TABLE `perfis`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Índices de tabela `postagens`
--
ALTER TABLE `postagens`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `suportes`
--
ALTER TABLE `suportes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `amizades`
--
ALTER TABLE `amizades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `curtidas_controle`
--
ALTER TABLE `curtidas_controle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT de tabela `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `perfis`
--
ALTER TABLE `perfis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `postagens`
--
ALTER TABLE `postagens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `suportes`
--
ALTER TABLE `suportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `amizades`
--
ALTER TABLE `amizades`
  ADD CONSTRAINT `amizades_ibfk_1` FOREIGN KEY (`id_remetente`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `amizades_ibfk_2` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `postagens` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `curtidas_controle`
--
ALTER TABLE `curtidas_controle`
  ADD CONSTRAINT `curtidas_controle_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `postagens` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
