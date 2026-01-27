require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração Centralizada da API
const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}/wp-json/biometry/v1`,
    headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 segundos de limite
});

// Etapa 1: Entrada do Usuário (Simples e Direta)
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h2>LenzId Biometria Facial</h2>
            <form action="/process" method="POST">
                <input type="text" name="external_user_id" placeholder="ID do Usuário" required style="padding: 10px;">
                <button type="submit" style="padding: 10px; cursor: pointer;">Iniciar Fluxo</button>
            </form>
            <p><small>Powered by LenzId (Auth Face API) – via RapidAPI</small></p>
        </div>
    `);
});

// Etapa 2 e 3: O "Cérebro" da Aplicação
app.post('/process', async (req, res) => {
    const { external_user_id } = req.body;
    const client_state = uuidv4();

    try {
        let endpoint = '/verify';
        
        // Verificação Automática de Status
        try {
            await api.post('/users/get', { external_user_id });
        } catch (error) {
            // Se não encontrar (404), o destino vira cadastro
            if (error.response?.status === 404) {
                endpoint = '/enroll';
            } else {
                throw new Error("Falha na comunicação com o servidor de usuários.");
            }
        }

        // Requisição do fluxo (Enroll ou Verify)
        const response = await api.post(endpoint, {
            external_user_id,
            redirect_url: process.env.REDIRECT_URL,
            client_state
        });

        if (response.data.success && response.data.biometry_url) {
            return res.redirect(response.data.biometry_url);
        }
        
        throw new Error("Não foi possível gerar a URL de biometria.");

    } catch (error) {
        console.error("❌ Erro no Processo:", error.message);
        res.status(500).send(`<h3>Erro:</h3><p>${error.message}</p><a href="/">Voltar</a>`);
    }
});

// Etapa 4 e 5: Resultado Final (Com suporte a nomes de parâmetros variados)
app.get('/final', async (req, res) => {
    // Suporte para ?client_state= ou ?state=
    const client_state = req.query.client_state || req.query.state;

    if (!client_state) {
        return res.status(400).send("Estado da sessão não identificado.");
    }

    try {
        const result = await api.post('/result', { client_state });
        const data = result.data;

        let displayMessage = "";
        let color = "black";

        // Mapeamento profissional de resultados conforme o enunciado
        if (data.flow === 'verify' && data.status === 'success') {
            displayMessage = "✅ Cliente legítimo";
            color = "green";
        } else if (data.flow === 'verify' && data.status === 'fail') {
            displayMessage = "❌ Verificação falhou";
            color = "red";
        } else if (data.flow === 'enroll' && data.reason === 'conflict') {
            displayMessage = "⚠️ Já existe um usuário cadastrado com este rosto";
            color = "orange";
        } else if (data.status === 'pending') {
            displayMessage = "⏳ Biometria pendente ou em processamento.";
            color = "blue";
        } else {
            displayMessage = `Status: ${data.status} - ${data.reason || 'Operação não concluída'}`;
        }

        res.send(`
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: ${color}">${displayMessage}</h1>
                <hr>
                <details open>
                    <summary>Dados brutos da API</summary>
                    <pre style="background: #f4f4f4; padding: 10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
                <br>
                <a href="/">Fazer novo teste</a>
            </div>
        `);
    } catch (error) {
        console.error("❌ Erro no Resultado:", error.response?.data || error.message);
        res.status(500).send("Erro ao consultar o resultado da biometria.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Profissional rodando em http://localhost:${PORT}`));