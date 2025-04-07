// KV namespace adı
const USERS = 'users';
const SIGNATURES = 'signatures';

// JWT secret key
const JWT_SECRET = 'your-secret-key'; // Production'da environment variable olarak ayarlanmalı

// Helper fonksiyonlar
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function generateToken(userId) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 saat
    };
    
    const encoder = new TextEncoder();
    const headerBase64 = btoa(JSON.stringify(header));
    const payloadBase64 = btoa(JSON.stringify(payload));
    const signature = btoa(await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey(
            'raw',
            encoder.encode(JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        ),
        encoder.encode(`${headerBase64}.${payloadBase64}`)
    ));
    
    return `${headerBase64}.${payloadBase64}.${signature}`;
}

async function verifyToken(token) {
    try {
        const [header, payload, signature] = token.split('.');
        const isValid = await crypto.subtle.verify(
            'HMAC',
            await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(JWT_SECRET),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            ),
            new Uint8Array(atob(signature).split('').map(c => c.charCodeAt(0))),
            new TextEncoder().encode(`${header}.${payload}`)
        );
        
        if (!isValid) return null;
        
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
        
        return decodedPayload;
    } catch (error) {
        return null;
    }
}

// Mail gönderme fonksiyonu
async function sendVerificationEmail(email, verificationCode) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email }]
            }],
            from: { email: 'noreply@email-signature.workers.dev' },
            subject: 'E-posta İmza Oluşturucu - Mail Doğrulama',
            content: [{
                type: 'text/html',
                value: `
                    <h2>E-posta Adresinizi Doğrulayın</h2>
                    <p>E-posta imza oluşturucu uygulamasına kayıt olduğunuz için teşekkürler.</p>
                    <p>Doğrulama kodunuz: <strong>${verificationCode}</strong></p>
                    <p>Bu kodu uygulamada ilgili alana girerek hesabınızı aktifleştirebilirsiniz.</p>
                    <p>Bu maili siz talep etmediyseniz lütfen dikkate almayın.</p>
                `
            }]
        })
    });

    if (!response.ok) {
        throw new Error('Mail gönderilemedi');
    }
}

// Doğrulama kodu oluşturma
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Kullanıcı kayıt işlemi
async function handleRegister(request) {
    const { email, password, name } = await request.json();
    
    // E-posta kontrolü
    const existingUser = await USERS.get(email);
    if (existingUser) {
        return new Response(JSON.stringify({ error: 'Bu e-posta adresi zaten kullanımda' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Doğrulama kodu oluştur
    const verificationCode = generateVerificationCode();
    
    // Kullanıcıyı geçici olarak kaydet
    await USERS.put(email, JSON.stringify({
        email,
        password: await hashPassword(password),
        name,
        verificationCode,
        isVerified: false,
        createdAt: Date.now()
    }));
    
    // Doğrulama maili gönder
    try {
        await sendVerificationEmail(email, verificationCode);
    } catch (error) {
        // Mail gönderilemezse kullanıcıyı sil
        await USERS.delete(email);
        return new Response(JSON.stringify({ error: 'Doğrulama maili gönderilemedi' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify({ 
        message: 'Doğrulama maili gönderildi',
        email
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Doğrulama kodu kontrolü
async function handleVerification(request) {
    const { email, code } = await request.json();
    
    const userData = await USERS.get(email);
    if (!userData) {
        return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const user = JSON.parse(userData);
    if (user.verificationCode !== code) {
        return new Response(JSON.stringify({ error: 'Geçersiz doğrulama kodu' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Kullanıcıyı doğrulanmış olarak işaretle
    user.isVerified = true;
    delete user.verificationCode;
    await USERS.put(email, JSON.stringify(user));
    
    // Token oluştur
    const token = await generateToken(email);
    
    return new Response(JSON.stringify({ 
        message: 'Hesap doğrulandı',
        token,
        user: {
            email: user.email,
            name: user.name
        }
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

// API Routes
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders
            });
        }
        
        try {
            switch (path) {
                case '/users':
                    if (request.method === 'POST') {
                        return handleRegister(request);
                    }
                    break;
                    
                case '/users/login':
                    if (request.method === 'POST') {
                        return handleLogin(request);
                    }
                    break;
                    
                case '/users/me':
                    if (request.method === 'GET') {
                        return handleGetCurrentUser(request);
                    }
                    break;
                    
                case '/verify':
                    if (request.method === 'POST') {
                        return handleVerification(request);
                    }
                    break;
                    
                case '/users/signatures':
                    if (request.method === 'GET') {
                        return handleGetUserSignatures(request);
                    } else if (request.method === 'POST') {
                        return handleSaveSignature(request);
                    }
                    break;
                    
                default:
                    return new Response('Not Found', { status: 404 });
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
}; 