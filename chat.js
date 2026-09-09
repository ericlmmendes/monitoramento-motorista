import { ref, push, onValue } from './BD.js';

export function montarChat({ database, containerId, nomeUsuario, destinatario, chatId = nomeUsuario }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const caminho = 'chats/' + chatId;
    container.innerHTML = `
        <section class="chat-box">
            <div class="chat-title"><i class="fa-solid fa-comments"></i> Comunicação com ${destinatario}</div>
            <div class="chat-messages" id="chat-messages-${containerId}"></div>
            <form class="chat-form" id="chat-form-${containerId}">
                <input id="chat-input-${containerId}" type="text" maxlength="500" placeholder="Digite uma mensagem..." autocomplete="off" required>
                <button type="submit" title="Enviar mensagem"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </section>`;

    const messages = document.getElementById(`chat-messages-${containerId}`);
    onValue(ref(database, caminho), snapshot => {
        messages.innerHTML = '';
        const dados = snapshot.val() || {};
        Object.values(dados).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).forEach(mensagem => {
            const item = document.createElement('div');
            item.className = `chat-message ${mensagem.autor === nomeUsuario ? 'mine' : 'theirs'}`;
            const autor = document.createElement('strong');
            const texto = document.createElement('span');
            const hora = document.createElement('small');
            autor.textContent = mensagem.autor || '';
            texto.textContent = mensagem.texto || '';
            hora.textContent = mensagem.hora || '';
            item.append(autor, texto, hora);
            messages.appendChild(item);
        });
        messages.scrollTop = messages.scrollHeight;
    });

    document.getElementById(`chat-form-${containerId}`).addEventListener('submit', async event => {
        event.preventDefault();
        const input = document.getElementById(`chat-input-${containerId}`);
        const texto = input.value.trim();
        if (!texto) return;
        await push(ref(database, caminho), {
            autor: nomeUsuario,
            texto,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
        });
        input.value = '';
    });
}
