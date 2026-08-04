const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// PUBLIC KLASÖRÜNÜ DIŞA AÇ
app.use(express.static('public'));

// TIKTOK KULLANICI ADIN
const TIKTOK_USERNAME = 'enes.xw_';

let tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokLiveConnection.connect().then(state => {
    console.log(`TikTok Canlı Yayınına Bağlandı: ${state.roomId}`);
}).catch(err => {
    console.error('TikTok Bağlantı Hatası:', err);
});

// KULLANICI BEĞENİ TAKİP HAFIZASI
const userLikes = {};

// BEĞENİ EVENT'İ (50 BEĞENİ = EKRANDA DOĞMA)
tiktokLiveConnection.on('like', data => {
    const username = data.uniqueId;
    const profilePic = data.userDetails.profilePictureUrl;

    userLikes[username] = (userLikes[username] || 0) + data.likeCount;

    if (userLikes[username] >= 50) {
        io.emit('spawnPlayer', {
            username: username,
            profilePic: profilePic
        });
        userLikes[username] = 0; // Sayacı sıfırla
    }
});

// HEDİYE / JETON EVENT'İ (GÜL VEYA HEDİYE = BÖLGE BÜYÜTME)
tiktokLiveConnection.on('gift', data => {
    // 1 numaralı giftType serideki son hediyedir
    if (data.giftType === 1 && !data.repeatEnd) return;

    io.emit('boostPlayer', {
        username: data.uniqueId,
        giftName: data.giftName,
        repeatCount: data.repeatCount
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif!`);
});
