<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualização do Motorista</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <style>
        :root { --primary: #2563eb; --bg: #f1f5f9; --text: #1e293b; }
        body { margin: 0; padding: 24px; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
        .card { max-width: 560px; margin: 20px auto; background: white; padding: 26px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,.06); }
        h1 { margin-top: 0; font-size: 1.45rem; display: flex; gap: 10px; align-items: center; }
        .data { display: grid; gap: 10px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
        .data p { margin: 0; }
        .foto { display: block; width: 180px; height: 180px; object-fit: cover; border-radius: 50%; margin: 20px auto; border: 4px solid #dbeafe; background: #f1f5f9; }
        .back { display: inline-block; margin-top: 18px; color: var(--primary); text-decoration: none; font-weight: 700; }
        .chat-box { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 18px; }
        .chat-title { font-weight: 700; margin-bottom: 10px; }
        .chat-messages { height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 10px; background: #f8fafc; border-radius: 10px; }
        .chat-message { max-width: 82%; padding: 8px 10px; border-radius: 10px; display: grid; gap: 3px; font-size: 13px; }
        .chat-message.mine { align-self: flex-end; background: #dbeafe; }
        .chat-message.theirs { align-self: flex-start; background: #e2e8f0; }
        .chat-message small { color: #64748b; }
        .chat-form { display: flex; gap: 8px; margin-top: 8px; }
        .chat-form input { flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 9px; }
        .chat-form button { width: 46px; border: 0; border-radius: 9px; background: var(--primary); color: white; cursor: pointer; }
    </style>
</head>
<body>
    <main class="card">
        <h1><i class="fa-solid fa-id-card" style="color:var(--primary)"></i> Dados do motorista</h1>
        <img id="foto-motorista" class="foto" src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Foto do motorista">
        <div class="data">
            <p><strong>Nome:</strong> <span id="nome">Carregando...</span></p>
            <p><strong>Placa do veículo:</strong> <span id="placa">Não informada</span></p>
            <p><strong>Rota:</strong> <span id="rota">Não informada</span></p>
        </div>
        <div id="chat-container"></div>
        <a class="back" href="gerenciamento.html"><i class="fa-solid fa-arrow-left"></i> Voltar para gerenciamento</a>
    </main>
    <script type="module">
        import { database, ref, onValue } from './BD.js';
        import { montarChat } from './chat.js';

        const motorista = new URLSearchParams(location.search).get('motorista');
        if (!motorista) {
            document.getElementById('nome').innerText = 'Motorista não informado';
        } else {
            onValue(ref(database, 'motoristas/' + motorista), snapshot => {
                if (!snapshot.exists()) {
                    document.getElementById('nome').innerText = 'Motorista não encontrado';
                    return;
                }
                const dados = snapshot.val();
                document.getElementById('nome').innerText = dados.nome || motorista;
                document.getElementById('placa').innerText = dados.placa || 'Não informada';
                document.getElementById('rota').innerText = dados.rota || 'Não informada';
                if (dados.fotoMotorista) document.getElementById('foto-motorista').src = dados.fotoMotorista;
            });
            montarChat({ database, containerId: 'chat-container', nomeUsuario: 'gerenciamento', destinatario: motorista, chatId: motorista });
        }
    </script>
</body>
</html>
