require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const api = axios.create({
    baseURL: `https://${process.env.RAPIDAPI_HOST}/wp-json/biometry/v1`,
    headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

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

app.post('/process', async (req, res) => {
    const { external_user_id } = req.body;
    
    // CORREÇÃO: UUID gerado aqui garante exclusividade para ESTA tentativa 
    const client_state = uuidv4(); 

    try {
        let endpoint = '/verify';
        
        // Verificação de Status
        try {
            await api.post('/users/get', { external_user_id });
        } catch (error) {
            if (error.response?.status === 404) {
                endpoint = '/enroll';
            } else {
                throw new Error("Falha na comunicação com o servidor de usuários.");
            }
        }

        // CORREÇÃO: Chamada obrigatória ao endpoint de fluxo para gerar uma NOVA URL 
        // Não há reaproveitamento de URL aqui, cada POST gera uma sessão nova na LenzId.
        const response = await api.post(endpoint, {
            external_user_id,
            redirect_url: process.env.REDIRECT_URL,
            client_state
        });

        if (response.data.success && response.data.biometry_url) {
            console.log(`🚀 Nova sessão criada | UUID: ${client_state} | Fluxo: ${endpoint}`);
            return res.redirect(response.data.biometry_url);
        }
        
        throw new Error("A API não retornou uma nova URL de biometria.");

    } catch (error) {
        console.error("❌ Erro no Processo:", error.message);
        res.status(500).send(`<h3>Erro na Sessão:</h3><p>${error.message}</p><a href="/">Tentar Novamente (Gera Novo Fluxo)</a>`);
    }
});

app.get('/final', async (req, res) => {
    const client_state = req.query.client_state || req.query.state;

    if (!client_state) {
        return res.status(400).send("Estado da sessão não identificado. <a href='/'>Reiniciar</a>");
    }

    try {
        const result = await api.post('/result', { client_state });
        const data = result.data;

        let displayMessage = "";
        let color = "black";

        if (data.flow === 'verify' && data.status === 'success') {
            displayMessage = "✅ Cliente legítimo";
            color = "green";
        } else if (data.flow === 'verify' && data.status === 'fail') {
            displayMessage = "❌ Verificação falhou";
            color = "red";
        } else if (data.flow === 'enroll' && data.reason === 'conflict') {
            displayMessage = "⚠️ Já existe um usuário cadastrado com este rosto";
            color = "orange";
        } else {
            displayMessage = `Resultado: ${data.status || 'Não concluído'}`;
            color = "gray";
        }

        res.send(`
            <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                <h1 style="color: ${color}">${displayMessage}</h1>
                <p>Sessão: ${client_state}</p>
                <hr>
                <a href="/" style="font-size: 18px; font-weight: bold;">Fazer nova tentativa (Novo UUID e Sessão)</a>
                <br><br>
                <details>
                    <summary>Ver JSON da API</summary>
                    <pre style="text-align: left; background: #f4f4f4; padding: 10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `);
    } catch (error) {
        res.status(500).send("Erro ao consultar resultado. Esta sessão pode ter expirado. <a href='/'>Voltar</a>");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));