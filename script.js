class FriendChat {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.roasts = [
            "人言否？"
            
        ];

        this.memes = [
            "😂", "🤣", "😭", "🤔", "🙄", "😏", "👏", "👍", "👎", "💀",
            "https://via.placeholder.com/150/FF6B6B/FFFFFF?text=Meme1",
            "https://via.placeholder.com/150/4ECDC4/FFFFFF?text=Meme2"
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSocket();
        this.loadStats();
    }

    bindEvents() {
        // 加入聊天室
        document.getElementById('join-btn').addEventListener('click', () => this.joinChat());
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinChat();
        });

        // 发送消息
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // 退出聊天室
        document.getElementById('leave-btn').addEventListener('click', () => this.leaveChat());

        // 功能按钮
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('button').dataset.action;
                this.handleFeature(action);
            });
        });

        // 表情选择器
        document.getElementById('emoji-btn').addEventListener('click', () => {
            const picker = document.getElementById('emoji-picker');
            picker.classList.toggle('hidden');
        });

        // 表情点击
        document.querySelectorAll('.emoji-list span').forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                const input = document.getElementById('message-input');
                input.value += e.target.textContent;
                document.getElementById('emoji-picker').classList.add('hidden');
            });
        });
    }

    setupSocket() {
        // 模拟WebSocket连接（实际部署时需要真实WebSocket服务器）
        this.socket = {
            send: (data) => {
                console.log('发送消息:', data);
                // 这里模拟收到消息
                setTimeout(() => {
                    this.receiveMessage(JSON.parse(data));
                }, 100);
            }
        };
    }

    joinChat() {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('请输入你的损友代号！');
            return;
        }

        this.currentUser = username;

        // 更新UI
        document.getElementById('username').value = '';
        document.querySelector('.user-setup').classList.add('hidden');
        document.getElementById('current-user').classList.remove('hidden');
        document.getElementById('display-name').textContent = username;
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-btn').disabled = false;

        // 添加到用户列表
        this.addUser(username);

        // 发送加入消息
        this.addSystemMessage(`${username} 加入了战场，大家小心！`);
    }

    leaveChat() {
        const username = this.currentUser;
        this.currentUser = null;

        // 更新UI
        document.querySelector('.user-setup').classList.remove('hidden');
        document.getElementById('current-user').classList.add('hidden');
        document.getElementById('message-input').disabled = true;
        document.getElementById('send-btn').disabled = true;

        // 从用户列表移除
        this.removeUser(username);

        // 发送离开消息
        this.addSystemMessage(`${username} 被击沉了！`);

        // 更新在线人数
        this.updateOnlineCount();
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || !this.currentUser) return;

        // 发送消息到服务器
        const messageData = {
            type: 'message',
            user: this.currentUser,
            content: message,
            timestamp: new Date().toISOString()
        };

        this.socket.send(JSON.stringify(messageData));

        // 显示自己发送的消息
        this.addMessage({
            user: this.currentUser,
            content: message,
            isCurrentUser: true
        });

        input.value = '';
        this.updateMessageCount();
    }

    receiveMessage(data) {
        if (data.type === 'message') {
            this.addMessage({
                user: data.user,
                content: data.content,
                isCurrentUser: data.user === this.currentUser
            });
        } else if (data.type === 'user_join') {
            this.addUser(data.user);
            this.addSystemMessage(`${data.user} 加入了聊天`);
        } else if (data.type === 'user_leave') {
            this.removeUser(data.user);
            this.addSystemMessage(`${data.user} 离开了聊天`);
        }
    }

    addMessage(data) {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${data.isCurrentUser ? 'user' : 'other'}`;
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-user">${data.user}</span>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.escapeHtml(data.content)}</div>
        `;

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addSystemMessage(content) {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addUser(username) {
        const userList = document.getElementById('user-list');
        const li = document.createElement('li');
        
        li.id = `user-${username}`;
        li.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${username}</span>
        `;

        userList.appendChild(li);
        this.updateOnlineCount();
    }

    removeUser(username) {
        const user = document.getElementById(`user-${username}`);
        if (user) user.remove();
        this.updateOnlineCount();
    }

    handleFeature(action) {
        if (!this.currentUser) {
            alert('请先加入聊天室！');
            return;
        }

        switch(action) {
            case 'roast':
                const roast = this.roasts[Math.floor(Math.random() * this.roasts.length)];
                document.getElementById('message-input').value = roast;
                break;
                
            case 'meme':
                const meme = this.memes[Math.floor(Math.random() * this.memes.length)];
                this.simulateSendMessage(meme);
                break;
                
            case 'sound':
                this.playSoundEffect();
                this.addSystemMessage(`${this.currentUser} 发动了音效攻击！`);
                break;
        }
    }

    simulateSendMessage(content) {
        if (!this.currentUser) return;

        this.addMessage({
            user: this.currentUser,
            content: content,
            isCurrentUser: true
        });

        this.updateMessageCount();
    }

    playSoundEffect() {
        const audio = document.getElementById('sound-effect');
        audio.currentTime = 0;
        audio.play().catch(e => console.log('音效播放失败:', e));
    }

    updateOnlineCount() {
        const userList = document.getElementById('user-list');
        const count = userList.children.length;
        document.getElementById('online-count').textContent = count;
    }

    updateMessageCount() {
        const current = parseInt(document.getElementById('message-count').textContent);
        document.getElementById('message-count').textContent = current + 1;
    }

    loadStats() {
        // 模拟加载统计数据
        document.getElementById('message-count').textContent = 
            Math.floor(Math.random() * 100) + 50;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FriendChat();
});