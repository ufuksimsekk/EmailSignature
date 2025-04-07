export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Ana sayfa - Form göster
        if (path === "/" && request.method === "GET") {
            return new Response(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>KV Veritabanı Temizleme</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                        h1 { color: #333; }
                        .container { margin-top: 20px; }
                        button { background-color: #f44336; color: white; padding: 10px 15px; border: none; cursor: pointer; }
                        button:hover { background-color: #d32f2f; }
                        .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                        .email-list { margin-top: 15px; }
                        .email-item { padding: 5px; border-bottom: 1px solid #eee; }
                        .success { color: green; }
                        .error { color: red; }
                    </style>
                </head>
                <body>
                    <h1>KV Veritabanı Temizleme</h1>
                    <div class="container">
                        <div class="card">
                            <h2>Tüm Verileri Temizle</h2>
                            <p>Bu işlem tüm KV veritabanı içeriğini silecektir. Bu işlem geri alınamaz!</p>
                            <button id="clearAll">Tüm Verileri Temizle</button>
                        </div>
                        
                        <div class="card">
                            <h2>Kayıtlı Kullanıcıları Listele</h2>
                            <button id="listUsers">Kullanıcıları Listele</button>
                            <div id="usersList" class="email-list"></div>
                        </div>
                        
                        <div class="card">
                            <h2>Belirli Bir Kullanıcıyı Sil</h2>
                            <form id="deleteUserForm">
                                <input type="email" id="userEmail" placeholder="E-posta adresi" required>
                                <button type="submit">Kullanıcıyı Sil</button>
                            </form>
                            <div id="deleteResult"></div>
                        </div>
                    </div>
                    
                    <script>
                        document.getElementById('clearAll').addEventListener('click', async () => {
                            if (confirm('Tüm verileri silmek istediğinizden emin misiniz?')) {
                                const response = await fetch('/clear-all', { method: 'POST' });
                                const result = await response.text();
                                alert(result);
                            }
                        });
                        
                        document.getElementById('listUsers').addEventListener('click', async () => {
                            const response = await fetch('/list-users');
                            const users = await response.json();
                            const usersList = document.getElementById('usersList');
                            usersList.innerHTML = '';
                            
                            if (users.length === 0) {
                                usersList.innerHTML = '<p>Kayıtlı kullanıcı bulunmuyor.</p>';
                                return;
                            }
                            
                            users.forEach(user => {
                                const item = document.createElement('div');
                                item.className = 'email-item';
                                item.textContent = user;
                                usersList.appendChild(item);
                            });
                        });
                        
                        document.getElementById('deleteUserForm').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const email = document.getElementById('userEmail').value;
                            const response = await fetch('/delete-user', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email })
                            });
                            const result = await response.json();
                            const deleteResult = document.getElementById('deleteResult');
                            if (result.success) {
                                deleteResult.innerHTML = '<p class="success">' + result.message + '</p>';
                            } else {
                                deleteResult.innerHTML = '<p class="error">' + result.error + '</p>';
                            }
                        });
                    </script>
                </body>
            </html>
            `, {
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Tüm verileri temizle
        if (path === "/clear-all" && request.method === "POST") {
            try {
                console.log('Tüm KV verilerini temizleme işlemi başlatıldı');
                
                // USERS KV namespace'ini temizle
                const users = await env.USERS.list();
                console.log(`Silinecek kullanıcı sayısı: ${users.keys.length}`);
                
                for (const key of users.keys) {
                    console.log(`Kullanıcı siliniyor: ${key.name}`);
                    await env.USERS.delete(key.name);
                }
                
                // SIGNATURES KV namespace'ini temizle
                const signatures = await env.SIGNATURES.list();
                console.log(`Silinecek imza sayısı: ${signatures.keys.length}`);
                
                for (const key of signatures.keys) {
                    console.log(`İmza siliniyor: ${key.name}`);
                    await env.SIGNATURES.delete(key.name);
                }
                
                console.log('Tüm KV verileri başarıyla temizlendi');
                
                return new Response('Tüm KV veritabanı başarıyla temizlendi', {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } catch (error) {
                console.error('KV temizleme hatası:', error);
                return new Response(`Hata: ${error.message}`, {
                    status: 500,
                    headers: {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        }
        
        // Kullanıcıları listele
        if (path === "/list-users" && request.method === "GET") {
            try {
                console.log('Kullanıcıları listeleme işlemi başlatıldı');
                
                const users = await env.USERS.list();
                const userEmails = users.keys.map(key => key.name);
                
                console.log(`Toplam ${userEmails.length} kullanıcı bulundu`);
                
                return new Response(JSON.stringify(userEmails), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } catch (error) {
                console.error('Kullanıcı listeleme hatası:', error);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        }
        
        // Belirli bir kullanıcıyı sil
        if (path === "/delete-user" && request.method === "POST") {
            try {
                const { email } = await request.json();
                console.log(`Kullanıcı silme isteği: ${email}`);
                
                const exists = await env.USERS.get(email);
                
                if (!exists) {
                    console.log(`Kullanıcı bulunamadı: ${email}`);
                    return new Response(JSON.stringify({ 
                        success: false, 
                        error: 'Kullanıcı bulunamadı' 
                    }), {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
                
                await env.USERS.delete(email);
                console.log(`Kullanıcı başarıyla silindi: ${email}`);
                
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: `${email} kullanıcısı başarıyla silindi` 
                }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } catch (error) {
                console.error('Kullanıcı silme hatası:', error);
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        }
        
        // OPTIONS istekleri için CORS desteği
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }
        
        return new Response('Not Found', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}; 