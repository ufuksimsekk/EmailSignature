// KV namespace adı
const USERS = 'users';
const SIGNATURES = 'signatures';

// CORS başlıkları
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

// Helper fonksiyonlar
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function generateToken(userId, env) {
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
    try {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(env.JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signatureArray = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            encoder.encode(`${headerBase64}.${payloadBase64}`)
        );
        
        const signature = btoa(String.fromCharCode(...new Uint8Array(signatureArray)));
        
        return `${headerBase64}.${payloadBase64}.${signature}`;
    } catch (error) {
        console.error('Token oluşturma hatası:', error);
        throw error;
    }
}

async function verifyToken(token, env) {
    try {
        const [header, payload, signature] = token.split('.');
        const isValid = await crypto.subtle.verify(
            'HMAC',
            await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(env.JWT_SECRET),
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
        console.error('JWT doğrulama hatası:', error);
        return null;
    }
}

// OAuth2.0 token yenileme fonksiyonu
async function refreshAccessToken(env) {
    try {
        console.log('Token yenileme isteği gönderiliyor...');
        console.log('GMAIL_CLIENT_ID:', env.GMAIL_CLIENT_ID);
        console.log('GMAIL_CLIENT_SECRET:', env.GMAIL_CLIENT_SECRET ? 'Var' : 'Yok');
        console.log('GMAIL_REFRESH_TOKEN:', env.GMAIL_REFRESH_TOKEN ? 'Var' : 'Yok');

        const params = new URLSearchParams({
            client_id: env.GMAIL_CLIENT_ID,
            client_secret: env.GMAIL_CLIENT_SECRET,
            refresh_token: env.GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        });

        console.log('Token yenileme isteği parametreleri:', params.toString());

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        console.log('Token yenileme yanıtı:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Token yenileme hatası:', errorData);
            throw new Error(`Token yenileme başarısız: ${errorData}`);
        }

        const data = await response.json();
        console.log('Yeni access token alındı');
        return data.access_token;
    } catch (error) {
        console.error('Token yenileme işlemi sırasında hata:', error);
        throw error;
    }
}

// Mail gönderme fonksiyonu
async function sendVerificationEmail(email, verificationCode, env) {
    try {
        if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN || !env.GMAIL_USER) {
            console.error('Gmail API ayarları eksik:', {
                GMAIL_CLIENT_ID: env.GMAIL_CLIENT_ID ? 'Var' : 'Yok',
                GMAIL_CLIENT_SECRET: env.GMAIL_CLIENT_SECRET ? 'Var' : 'Yok',
                GMAIL_REFRESH_TOKEN: env.GMAIL_REFRESH_TOKEN ? 'Var' : 'Yok',
                GMAIL_USER: env.GMAIL_USER ? 'Var' : 'Yok'
            });
            throw new Error('Gmail API ayarları yapılandırılmamış');
        }

        const accessToken = await refreshAccessToken(env);
        
        // Latin1 karakterlerine dönüştürülmüş e-posta içeriği
        const emailContent = `From: ${env.GMAIL_USER}
To: ${email}
Subject: E-posta Imza Olusturucu - Mail Dogrulama
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

<h2>E-posta Adresinizi Dogrulayin</h2>
<p>E-posta imza olusturucu uygulamasina kayit oldugunuz icin tesekkurler.</p>
<p>Dogrulama kodunuz: <strong>${verificationCode}</strong></p>
<p>Bu kodu uygulamada ilgili alana girerek hesabinizi aktiflestirebilirsiniz.</p>
<p>Bu maili siz talep etmediyseniz lutfen dikkate almayin.</p>`;

        // Base64'e dönüştürmeden önce Latin1'e çevir
        const latin1Content = unescape(encodeURIComponent(emailContent));
        const base64Email = btoa(latin1Content).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: base64Email
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gmail API hata detayı:', errorData);
            throw new Error(`Mail gönderilemedi: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('E-posta gönderme işlemi sırasında hata:', error);
        throw error;
    }
}

// Doğrulama kodu oluşturma
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Kullanıcı kayıt işlemi
async function handleRegister(request, env) {
    try {
        const { email, password, name } = await request.json();
        console.log('Kayıt isteği alındı:', { email, name });
        
        // E-posta formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Geçersiz e-posta formatı:', email);
            return new Response(JSON.stringify({ error: 'Geçerli bir e-posta adresi girmelisiniz' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Şifre gereksinimleri kontrolü
        if (password.length < 8) {
            console.log('Şifre çok kısa:', password.length);
            return new Response(JSON.stringify({ error: 'Şifre en az 8 karakter uzunluğunda olmalıdır' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Şifre karmaşıklık kontrolü
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!(hasUpperCase && hasLowerCase && hasNumbers) && !hasSpecialChar) {
            console.log('Şifre karmaşıklık gereksinimlerini karşılamıyor');
            return new Response(JSON.stringify({
                error: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli veya özel karakter içermelidir'
            }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Ad boş olmamalı
        if (!name || name.trim() === '') {
            console.log('Ad boş olamaz');
            return new Response(JSON.stringify({ error: 'Ad alanı boş olamaz' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // E-posta kontrolü - Direkt listeleme yaparak
        const users = await env.USERS.list();
        console.log('Tüm kullanıcı anahtarları:', users.keys.map(k => k.name));
        
        // Kullanıcı var mı diye kontrol et
        const userExists = users.keys.some(key => key.name === email);
        console.log(`Kullanıcı var mı kontrolü (${email}):`, userExists);
        
        // Normal get isteği
        const existingUser = await env.USERS.get(email);
        console.log('Get isteği sonucu:', existingUser ? 'Kullanıcı var' : 'Kullanıcı yok');
        
        if (existingUser || userExists) {
            console.log('E-posta zaten kullanımda, silmeye çalışıyorum:', email);
            
            // Varsa sil ve yeniden kontrol et
            await env.USERS.delete(email);
            
            // Silme işleminden sonra tekrar kontrol
            const checkAfterDelete = await env.USERS.get(email);
            console.log('Silme işleminden sonra kontrol:', checkAfterDelete ? 'Hala var (silme başarısız)' : 'Silindi');
            
            if (checkAfterDelete) {
                return new Response(JSON.stringify({ error: 'Kullanıcı silinemiyor, lütfen temizleme aracını kullanın' }), {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
        }
        
        // Doğrulama kodu oluştur
        const verificationCode = generateVerificationCode();
        console.log('Doğrulama kodu oluşturuldu:', verificationCode);
        
        // Kullanıcıyı kaydet
        const userData = {
            email,
            password: await hashPassword(password),
            name,
            verificationCode,
            isVerified: false,
            createdAt: Date.now()
        };
        
        await env.USERS.put(email, JSON.stringify(userData));
        console.log('Kullanıcı kaydedildi:', email);
        
        // Kayıt başarılı mı diye kontrol et
        const checkUser = await env.USERS.get(email);
        console.log('Kayıt sonrası kontrol:', checkUser ? 'Başarılı' : 'Başarısız');
        
        // Doğrulama maili gönder
        try {
            await sendVerificationEmail(email, verificationCode, env);
            console.log('Doğrulama maili gönderildi:', email);
        } catch (error) {
            console.error('Mail gönderme hatası:', error);
            // Mail gönderilemezse kullanıcıyı sil
            await env.USERS.delete(email);
            console.log('Mail gönderme hatası nedeniyle kullanıcı silindi:', email);
            
            return new Response(JSON.stringify({ error: 'Doğrulama maili gönderilemedi: ' + error.message }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        return new Response(JSON.stringify({ 
            message: 'Doğrulama maili gönderildi',
            email
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('Kayıt işlemi hatası:', error);
        return new Response(JSON.stringify({ error: 'Kayıt işlemi sırasında hata: ' + error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Kullanıcı giriş işlemi
async function handleLogin(request, env) {
    try {
        const { email, password } = await request.json();
        console.log('Giriş isteği alındı:', email);
        
        const userData = await env.USERS.get(email);
        
        if (!userData) {
            console.log('Kullanıcı bulunamadı:', email);
            return new Response(JSON.stringify({ error: 'Geçersiz e-posta veya şifre' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const user = JSON.parse(userData);
        
        // Şifre doğrulama
        const hashedPassword = await hashPassword(password);
        if (user.password !== hashedPassword) {
            console.log('Geçersiz şifre:', email);
            return new Response(JSON.stringify({ error: 'Geçersiz e-posta veya şifre' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Kullanıcı doğrulanmamışsa
        if (!user.isVerified) {
            // Yeni bir doğrulama kodu oluştur
            const verificationCode = generateVerificationCode();
            user.verificationCode = verificationCode;
            await env.USERS.put(email, JSON.stringify(user));
            
            try {
                await sendVerificationEmail(email, verificationCode, env);
                console.log('Yeni doğrulama maili gönderildi:', email);
            } catch (error) {
                console.error('Mail gönderme hatası:', error);
            }
            
            return new Response(JSON.stringify({ 
                error: 'Hesabınız doğrulanmamış. Yeni bir doğrulama kodu gönderildi.', 
                needsVerification: true,
                email: user.email 
            }), {
                status: 403,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Token oluştur
        const token = await generateToken(email, env);
        
        return new Response(JSON.stringify({ 
            message: 'Giriş başarılı',
            token,
            user: {
                email: user.email,
                name: user.name
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('Giriş işlemi hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Doğrulama işlemi
async function handleVerification(request, env) {
    try {
        const { email, code } = await request.json();
        console.log('Doğrulama isteği alındı:', { email, code });
        
        const userData = await env.USERS.get(email);
        console.log('Kullanıcı verisi:', userData ? 'Var' : 'Yok');
        
        if (!userData) {
            return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const user = JSON.parse(userData);
        console.log('Kullanıcı doğrulama kodu:', user.verificationCode);
        
        if (user.verificationCode !== code) {
            return new Response(JSON.stringify({ error: 'Geçersiz doğrulama kodu' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // Kullanıcıyı doğrulanmış olarak işaretle
        user.isVerified = true;
        delete user.verificationCode;
        
        await env.USERS.put(email, JSON.stringify(user));
        console.log('Kullanıcı doğrulandı:', email);
        
        // Token oluştur
        const token = await generateToken(email, env);
        
        return new Response(JSON.stringify({ 
            message: 'Hesap doğrulandı',
            token,
            user: {
                email: user.email,
                name: user.name
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('Doğrulama işlemi hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Kullanıcı token doğrulama
async function handleGetCurrentUser(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const email = payload.sub;
        const userData = await env.USERS.get(email);
        
        if (!userData) {
            return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const user = JSON.parse(userData);
        
        return new Response(JSON.stringify({ 
            user: {
                email: user.email,
                name: user.name,
                isVerified: user.isVerified
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('Kullanıcı bilgisi getirme hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// İmza kaydetme
async function handleSaveSignature(request, env) {
    try {
        // Token doğrulama
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const email = payload.sub;
        const { name, html, settings } = await request.json();
        
        // İmza ID'si oluştur
        const signatureId = crypto.randomUUID();
        
        // İmzayı kaydet
        const signature = {
            id: signatureId,
            name,
            html,
            settings,
            createdAt: Date.now()
        };
        
        // Kullanıcının imzalarını getir
        const userSignaturesKey = `${email}:signatures`;
        const userSignaturesData = await env.SIGNATURES.get(userSignaturesKey);
        let userSignatures = userSignaturesData ? JSON.parse(userSignaturesData) : [];
        
        // Yeni imzayı ekle
        userSignatures.push(signature);
        
        // İmzaları kaydet
        await env.SIGNATURES.put(userSignaturesKey, JSON.stringify(userSignatures));
        
        return new Response(JSON.stringify({ 
            message: 'İmza başarıyla kaydedildi',
            signature
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('İmza kaydetme hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Kullanıcının imzalarını getirme
async function handleGetUserSignatures(request, env) {
    try {
        // Token doğrulama
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const email = payload.sub;
        
        // Kullanıcının imzalarını getir
        const userSignaturesKey = `${email}:signatures`;
        const userSignaturesData = await env.SIGNATURES.get(userSignaturesKey);
        const userSignatures = userSignaturesData ? JSON.parse(userSignaturesData) : [];
        
        return new Response(JSON.stringify({ 
            signatures: userSignatures
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('İmza getirme hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// İmza silme
async function handleDeleteSignature(request, env, signatureId) {
    try {
        // Token doğrulama
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const email = payload.sub;
        
        console.log(`İmza silme işlemi başlatıldı: Kullanıcı=${email}, İmza ID=${signatureId}`);
        
        // Kullanıcının imzalarını getir
        const userSignaturesKey = `${email}:signatures`;
        const userSignaturesData = await env.SIGNATURES.get(userSignaturesKey);
        
        if (!userSignaturesData) {
            console.log('Kullanıcının hiç imzası yok');
            return new Response(JSON.stringify({ error: 'İmza bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        let userSignatures = JSON.parse(userSignaturesData);
        
        // Silinecek imzayı bul
        const signatureIndex = userSignatures.findIndex(sig => sig.id === signatureId);
        
        if (signatureIndex === -1) {
            console.log('Belirtilen ID ile imza bulunamadı:', signatureId);
            return new Response(JSON.stringify({ error: 'İmza bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        // İmzayı sil
        userSignatures.splice(signatureIndex, 1);
        
        // Güncellenmiş imza listesini kaydet
        await env.SIGNATURES.put(userSignaturesKey, JSON.stringify(userSignatures));
        
        console.log('İmza başarıyla silindi');
        
        return new Response(JSON.stringify({ 
            message: 'İmza başarıyla silindi',
            id: signatureId
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('İmza silme hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Tekil imza getirme
async function handleGetSingleSignature(request, env, signatureId) {
    try {
        // Token doğrulama
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme başlığı eksik' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyToken(token, env);
        
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token' }), {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        const email = payload.sub;
        
        console.log(`Tekil imza getirme işlemi başlatıldı: Kullanıcı=${email}, İmza ID=${signatureId}`);
        
        // Kullanıcının imzalarını getir
        const userSignaturesKey = `${email}:signatures`;
        const userSignaturesData = await env.SIGNATURES.get(userSignaturesKey);
        
        if (!userSignaturesData) {
            console.log('Kullanıcının hiç imzası yok');
            return new Response(JSON.stringify({ error: 'İmza bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        let userSignatures = JSON.parse(userSignaturesData);
        
        // İmzayı bul
        const signature = userSignatures.find(sig => sig.id === signatureId);
        
        if (!signature) {
            console.log('Belirtilen ID ile imza bulunamadı:', signatureId);
            return new Response(JSON.stringify({ error: 'İmza bulunamadı' }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        console.log('İmza başarıyla bulundu:', signature.id);
        
        return new Response(JSON.stringify(signature), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    } catch (error) {
        console.error('İmza getirme hatası:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// API Routes
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Preflight isteklerini yönet
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders
            });
        }
        
        try {
            // Belirli bir imza ID'si ile ilgili endpoint işleme
            if (path.startsWith('/users/signatures/') && path.length > 18) {
                const signatureId = path.substring(18); // '/users/signatures/' sonrası
                
                if (request.method === 'GET') {
                    // Belirli bir imzayı getir
                    return handleGetSingleSignature(request, env, signatureId);
                } else if (request.method === 'DELETE') {
                    // İmza silme işlemi
                    return handleDeleteSignature(request, env, signatureId);
                } else if (request.method === 'PUT') {
                    // İmza güncelleme işlemi
                    return new Response('Not Implemented', { status: 501, headers: corsHeaders });
                }
            }
            
            // Standart endpoint işleme
            switch (path) {
                case '/users':
                    if (request.method === 'POST') {
                        return handleRegister(request, env);
                    }
                    break;
                    
                case '/users/login':
                    if (request.method === 'POST') {
                        return handleLogin(request, env);
                    }
                    break;
                    
                case '/users/me':
                    if (request.method === 'GET') {
                        return handleGetCurrentUser(request, env);
                    }
                    break;
                    
                case '/verify':
                    if (request.method === 'POST') {
                        return handleVerification(request, env);
                    }
                    break;
                    
                case '/users/signatures':
                    if (request.method === 'GET') {
                        return handleGetUserSignatures(request, env);
                    } else if (request.method === 'POST') {
                        return handleSaveSignature(request, env);
                    }
                    break;
                    
                default:
                    return new Response('Not Found', { 
                        status: 404,
                        headers: corsHeaders
                    });
            }
            
            return new Response('Method Not Allowed', { 
                status: 405,
                headers: corsHeaders
            });
        } catch (error) {
            console.error('API hatası:', error);
            return new Response(JSON.stringify({ error: error.message }), { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }
}; 