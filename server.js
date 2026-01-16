const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 存储在线用户
const users = new Map();
let messageCount = 0;

// 提供静态文件
app.use(express.static(__dirname));

// WebSocket 连接处理
wss.on('connection', (ws) => {
    let currentUser = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    currentUser = data.username;
                    users.set(ws, currentUser);
                    
                    // 广播用户加入
                    broadcast({
                        type: 'user_join',
                        user: currentUser
                    });
                    
                    // 发送当前在线用户列表
                    sendUserList();
                    break;
                    
                case 'message':
                    messageCount++;
                    
                    // 广播消息
                    broadcast({
                        type: 'message',
                        user: currentUser,
                        content: data.content,
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'leave':
                    if (currentUser) {
                        users.delete(ws);
                        broadcast({
                            type: 'user_leave',
                            user: currentUser
                        });
                        sendUserList();
                    }
                    break;
            }
        } catch (error) {
            console.error('消息解析错误:', error);
        }
    });

    ws.on('close', () => {
        if (currentUser) {
            users.delete(ws);
            broadcast({
                type: 'user_leave',
                user: currentUser
            });
            sendUserList();
        }
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'system',
        content: '欢迎来到损友聊天室！'
    }));
});

// 广播消息给所有客户端
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// 发送在线用户列表
function sendUserList() {
    const userList = Array.from(users.values());
    broadcast({
        type: 'user_list',
        users: userList
    });
}

// API 路由
app.get('/api/stats', (req, res) => {
    res.json({
        online: users.size,
        messages: messageCount,
        serverTime: new Date().toISOString()
    });
});

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});