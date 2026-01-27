# 📋 LenzId Biometric Auth (Node.js)

Esta é uma aplicação demonstrativa desenvolvida para integrar a **API de Biometria Facial LenzId (Auth Face API)** via RapidAPI. O objetivo principal é fornecer um fluxo automatizado de cadastro e verificação de usuários utilizando reconhecimento facial de alta precisão.

### 🎯 Objetivo do Projeto

Criar um sistema local que gerencie o estado do usuário (cadastrado ou não) e direcione-o automaticamente para a ação correta, garantindo segurança e fluidez no processo de autenticação.

---

## 🔄 Fluxo Operacional

A aplicação segue rigorosamente o seguinte fluxo funcional:

1. **Entrada de Identificador**: O usuário acessa a aplicação e informa seu `external_user_id`.
2. **Verificação de Status (Automática)**:
* O sistema consulta o endpoint `/users/get`.
* **Cenário A (404)**: Usuário não encontrado -> Redireciona para o fluxo de **Enroll** (Cadastro).
* **Cenário B (200)**: Usuário já cadastrado -> Redireciona para o fluxo de **Verify** (Verificação).


3. **Geração de Sessão**: Para cada tentativa, um novo UUID é gerado como `client_state` para garantir a unicidade e segurança da transação.
4. **Captura Biométrica**: O usuário é enviado para a `biometry_url` da LenzId para realizar a prova de vida e captura da face.
5. **Consulta de Resultado**: Após a captura, o usuário retorna à aplicação, que consome o endpoint `/result` para exibir o veredito final.

---

## 🛠️ Tecnologias e Dependências

* **Runtime**: Node.js (v18+)
* **Framework**: Express (Servidor Web)
* **Requisições**: Axios
* **Identificadores**: UUID (v4)
* **Segurança**: Dotenv (Variáveis de ambiente)

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

* Node.js instalado.
* Conta ativa no **RapidAPI**.
* Inscrição na API [LenzId (Auth Face API)](https://rapidapi.com/lenzid-lenzid-default/api/auth-face-biometric-authentication-api).

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/andradetk/projeto-lenzid.git
cd projeto-lenzid
npm install

```

### 3. Configuração do Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto seguindo o modelo do `.env.example`:

```env
PORT=3000
RAPIDAPI_KEY=SUA_CHAVE_AQUI
RAPIDAPI_HOST=auth-face-biometric-authentication-api.p.rapidapi.com
REDIRECT_URL=http://localhost:3000/final

```

### 4. Inicialização

Inicie o servidor local:

```bash
npm start
# ou para desenvolvimento
npm run dev

```

Acesse `http://localhost:3000` no seu navegador.

---

## 📌 Endpoints Utilizados (LenzId API)

| Endpoint | Função |
| --- | --- |
| `POST /users/get` | Verifica se o ID do usuário já possui biometria cadastrada. |
| `POST /enroll` | Gera link para cadastro de nova face. |
| `POST /verify` | Gera link para verificação de face existente. |
| `POST /result` | Consulta o status final da transação via `client_state`. |

---

## ✅ Tratamento de Resultados

A aplicação está preparada para exibir e tratar as seguintes respostas:

* **Verify aprovado**: “Cliente legítimo”
* **Verify falhou**: “Verificação falhou”
* **Conflito no Enroll**: “Já existe um usuário cadastrado com este rosto”
* **Pendente**: "Aguardando conclusão da captura biométrica."

---

## 🔒 Segurança

* As chaves de API são gerenciadas via variáveis de ambiente.
* O arquivo `.env` está devidamente listado no `.gitignore` para evitar vazamentos de credenciais.

---

**Powered by LenzId (Auth Face API) – via RapidAPI**
