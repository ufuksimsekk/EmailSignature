// Logo boyut kontrolü için değişkenler
let logoSize = 80;
let maintainRatio = true;

// Kullanıcı Yönetimi
let currentUser = null;
let isLoginMode = true;

// API Endpoint
const API_URL = 'https://email-signature-api.simsekufuk4.workers.dev';

// DOM Elementleri
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authNameGroup = document.getElementById('authNameGroup');
const authName = document.getElementById('authName');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchAuthMode = document.getElementById('switchAuthMode');
const closeModal = document.querySelector('.close-modal');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const verificationCodeGroup = document.getElementById('verificationCodeGroup');

document.addEventListener('DOMContentLoaded', async function() {
    // Otomatik giriş kontrolü
    await checkAuth();

    // Tab değiştirme fonksiyonu
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Aktif tab sınıfını güncelle
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Tab içeriğini göster/gizle
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // İmza oluştur butonu
    document.getElementById('generateBtn').addEventListener('click', generateSignature);
    
    // HTML kopyala butonu
    document.getElementById('copyBtn').addEventListener('click', function() {
        const signaturePreview = document.getElementById('signaturePreview');
        
        // Seçim ve kopyalama için yardımcı fonksiyon
        function selectElementContents(el) {
            // Geçerli seçimi temizle
            if (window.getSelection) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                
                // İçeriği seç
                const range = document.createRange();
                range.selectNodeContents(el);
                selection.addRange(range);
                
                // Kopyala
                document.execCommand('copy');
                
                // Seçimi temizle
                selection.removeAllRanges();
                return true;
            }
            return false;
        }
        
        // Doğrudan HTML'i seç ve kopyala
        const isCopied = selectElementContents(signaturePreview);
        
        if (isCopied) {
            alert('İmza kopyalandı! Outlook\'a yapıştırırken, lütfen "Zengin Metin" veya "HTML" formatında yapıştırın.');
        } else {
            // Yedek metod - daha önce kullanılan textarea yöntemi
            const htmlContent = signaturePreview.innerHTML;
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = htmlContent;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            alert('İmza kopyalandı! Outlook\'a yapıştırırken, lütfen "Zengin Metin" veya "HTML" formatında yapıştırın.');
        }
    });
    
    // Kodu göster butonu
    document.getElementById('viewCodeBtn').addEventListener('click', function() {
        const signaturePreview = document.getElementById('signaturePreview');
        const htmlContent = signaturePreview.innerHTML;
        
        // HTML içeriğini güzelleştir/format
        const formattedHTML = formatHTML(htmlContent);
        
        // Popup oluştur
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Modal içeriği
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.maxWidth = '80%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflow = 'auto';
        modalContent.style.position = 'relative';
        
        // Başlık
        const title = document.createElement('h3');
        title.textContent = 'HTML Kodu';
        title.style.marginTop = '0';
        
        // Kapat butonu
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '10px';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        };
        
        // Kod alanı
        const codeView = document.createElement('pre');
        codeView.style.whiteSpace = 'pre-wrap';
        codeView.style.fontFamily = 'monospace';
        codeView.style.fontSize = '12px';
        codeView.style.backgroundColor = '#f5f5f5';
        codeView.style.padding = '10px';
        codeView.style.borderRadius = '4px';
        codeView.style.overflowX = 'auto';
        codeView.style.maxHeight = 'calc(80vh - 100px)';
        codeView.textContent = formattedHTML;
        
        // Kopyala butonu
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Kodu Kopyala';
        copyBtn.style.marginTop = '10px';
        copyBtn.style.padding = '8px 16px';
        copyBtn.style.backgroundColor = '#3498db';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.color = 'white';
        copyBtn.style.cursor = 'pointer';
        copyBtn.onclick = function() {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = formattedHTML;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            copyBtn.textContent = 'Kopyalandı!';
            setTimeout(() => {
                copyBtn.textContent = 'Kodu Kopyala';
            }, 2000);
        };
        
        // DOM'a ekle
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(codeView);
        modalContent.appendChild(copyBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // ESC tuşu ile kapatma
        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    });
    
    // İmzayı kaydet butonu
    document.getElementById('saveBtn').addEventListener('click', function() {
        const signatureName = prompt('İmzanız için bir isim girin:');
        if (!signatureName) return;
        
        const signatureData = collectFormData();
        signatureData.name = signatureName;
        signatureData.html = document.getElementById('signaturePreview').innerHTML;
        
        // Kullanıcı giriş yapmış mı kontrol et
        if (currentUser && currentUser.token) {
            // Buluta kaydet
            saveSignatureToCloud(signatureData)
                .then(() => {
                    alert(`"${signatureName}" imzası başarıyla buluta kaydedildi!`);
                    // Kaydedilen imzalar listesini güncelle
                    updateSavedSignaturesList();
                    // Ayarlar sekmesine geç - imzaları göstermek için
                    switchTab('settings');
                })
                .catch(error => {
                    console.error('Buluta kaydetme hatası:', error);
                    alert('Buluta kaydetme başarısız oldu, yerel olarak kaydediliyor...');
                    saveSignatureLocally(signatureData);
                    // Kaydedilen imzalar listesini güncelle
                    updateSavedSignaturesList();
                    // Ayarlar sekmesine geç - imzaları göstermek için
                    switchTab('settings');
                });
        } else {
            // Yerel storage'a kaydet
            saveSignatureLocally(signatureData);
            alert(`"${signatureName}" imzası yerel olarak kaydedildi! Bulutta saklamak için giriş yapın.`);
            
            // Kaydedilen imzalar listesini güncelle
            updateSavedSignaturesList();
            
            // Ayarlar sekmesine geç - imzaları göstermek için
            switchTab('settings');
        }
    });
    
    // Tüm imzaları dışa aktar butonu
    document.getElementById('exportAllBtn').addEventListener('click', function() {
        const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        if (savedSignatures.length === 0) {
            alert('Dışa aktarılacak imza bulunamadı.');
            return;
        }
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedSignatures));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "email_signatures.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
    
    // İmzaları içe aktar butonu
    document.getElementById('importSignaturesBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSignatures = JSON.parse(e.target.result);
                if (!Array.isArray(importedSignatures)) {
                    throw new Error('Geçersiz imza dosyası');
                }
                
                // Mevcut imzaları al
                let savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
                
                // İçe aktarılan imzaları ekle
                savedSignatures = [...savedSignatures, ...importedSignatures];
                localStorage.setItem('emailSignatures', JSON.stringify(savedSignatures));
                
                // Listeyi güncelle
                updateSavedSignaturesList();
                
                alert(`${importedSignatures.length} imza başarıyla içe aktarıldı!`);
            } catch (error) {
                alert('İmzalar içe aktarılırken bir hata oluştu. Geçerli bir imza dosyası seçtiğinizden emin olun.');
                console.error('İçe aktarma hatası:', error);
            }
        };
        reader.readAsText(file);
    });

    // Sayfa yüklendiğinde kaydedilen imzaları göster
    updateSavedSignaturesList();
    
    // Örnek imza oluştur
    generateSignature();
    
    // Logo boyut kontrollerini göster/gizle
    document.getElementById('logoUrl').addEventListener('input', function() {
        const logoControls = document.querySelector('.logo-size-controls');
        logoControls.style.display = this.value ? 'block' : 'none';
        generateSignature(); // Önizlemeyi güncelle
    });

    // Logo boyut slider'ı için event listener
    document.getElementById('logoSize').addEventListener('input', function() {
        logoSize = parseInt(this.value);
        document.getElementById('logoSizeValue').textContent = logoSize + 'px';
        generateSignature(); // Önizlemeyi güncelle
    });

    document.getElementById('logoMaintainRatio').addEventListener('change', function() {
        maintainRatio = this.checked;
        generateSignature(); // Önizlemeyi güncelle
    });

    document.getElementById('logoFile').addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function(e) {
            // Base64 olarak URL input'una yaz
            document.getElementById('logoUrl').value = e.target.result;
            document.querySelector('.logo-size-controls').style.display = 'block';
            generateSignature(); // Otomatik önizleme güncelle
        };
        reader.readAsDataURL(file);
    });

    // Google Fonts API'den font listesini al
    fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBp-sgEHVMBN2UXK7z-bCjLVjc4PI8-7cY&sort=popularity')
        .then(response => response.json())
        .then(data => {
            const fontSelect = document.getElementById('font');
            const systemFonts = ['Arial', 'Georgia', 'Courier New'];
            
            // Önce sistem fontlarını ekle
            systemFonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                fontSelect.appendChild(option);
            });
            
            // Google Fonts'ı ekle
            data.items.forEach(font => {
                const option = document.createElement('option');
                option.value = font.family;
                option.textContent = font.family;
                fontSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Google Fonts yüklenirken hata oluştu:', error);
        });

    document.getElementById('font').addEventListener('change', function() {
        const selectedFont = this.value;
        const fontLink = document.getElementById('fontLink');
        
        // Google Fonts URL'sini güncelle
        if (selectedFont !== 'Arial' && selectedFont !== 'Georgia' && selectedFont !== 'Courier New') {
            const fontName = selectedFont.replace(/\s+/g, '+');
            fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
        } else {
            fontLink.href = '';
        }
        
        // Önizlemeyi hemen güncelle
        generateSignature();
    });
    
    window.addEventListener('DOMContentLoaded', () => {
        const defaultFont = document.getElementById('font').value.trim();
        const fontLink = document.getElementById('fontLink');
        
        // Sistem fontları listesi
        const systemFonts = ['Arial', 'Georgia', 'Courier New'];
        
        if (systemFonts.includes(defaultFont)) {
            fontLink.href = '';
        } else {
            const googleFontName = defaultFont.replace(/\s+/g, '+');
            fontLink.href = `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;700&display=swap`;
        }
    });

    // Canlı önizleme için form elemanlarını dinle
    const formElements = [
        'name', 'title', 'company', 'email', 'phone', 'website', 'address',
        'template', 'fontSize', 'primaryColor', 'secondaryColor',
        'logoUrl', 'avatarUrl', 'disclaimer', 'linkedinUrl', 'twitterUrl',
        'facebookUrl', 'instagramUrl'
    ];

    formElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', () => {
                generateSignature();
            });
        }
    });

    // Renk seçiciler için özel dinleyici
    document.getElementById('primaryColor').addEventListener('input', function() {
        document.getElementById('primaryColorHex').value = this.value;
        generateSignature();
    });
    
    document.getElementById('primaryColorHex').addEventListener('input', function() {
        document.getElementById('primaryColor').value = this.value;
        generateSignature();
    });
    
    document.getElementById('secondaryColor').addEventListener('input', function() {
        document.getElementById('secondaryColorHex').value = this.value;
        generateSignature();
    });
    
    document.getElementById('secondaryColorHex').addEventListener('input', function() {
        document.getElementById('secondaryColor').value = this.value;
        generateSignature();
    });

    // Sosyal medya checkbox'ları için dinleyici
    const socialCheckboxes = ['linkedin', 'twitter', 'facebook', 'instagram'];
    socialCheckboxes.forEach(social => {
        document.getElementById(social).addEventListener('change', function() {
            const socialLinksContainer = document.getElementById('socialLinksContainer');
            const socialLinkInput = document.querySelector(`.${social}-link`);
            
            if (this.checked) {
                socialLinksContainer.style.display = 'block';
                socialLinkInput.style.display = 'block';
            } else {
                socialLinkInput.style.display = 'none';
                
                const anyChecked = socialCheckboxes.some(s => document.getElementById(s).checked);
                if (!anyChecked) {
                    socialLinksContainer.style.display = 'none';
                }
            }
            generateSignature();
        });
    });
    
    // Şablon seçimi
    const templates = document.querySelectorAll('.template');
    templates.forEach(template => {
        template.addEventListener('click', function() {
            document.querySelectorAll('.template').forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            
            const templateValue = this.getAttribute('data-template');
            document.getElementById('template').value = templateValue;
            generateSignature();
        });
    });

    // Sosyal medya checkbox'ları için event listener'lar
    document.getElementById('linkedin').addEventListener('change', updateSocialLinksVisibility);
    document.getElementById('twitter').addEventListener('change', updateSocialLinksVisibility);
    document.getElementById('facebook').addEventListener('change', updateSocialLinksVisibility);
    document.getElementById('instagram').addEventListener('change', updateSocialLinksVisibility);
    
    // Sosyal medya linklerini dinleyelim
    document.getElementById('linkedinUrl').addEventListener('input', generateSignature);
    document.getElementById('twitterUrl').addEventListener('input', generateSignature);
    document.getElementById('facebookUrl').addEventListener('input', generateSignature);
    document.getElementById('instagramUrl').addEventListener('input', generateSignature);
    
    // Sayfa yüklendiğinde sosyal medya linklerinin görünürlüğünü güncelle
    updateSocialLinksVisibility();

    // Kullanıcı Yönetimi Event Listeners
    loginBtn.addEventListener('click', () => {
        isLoginMode = true;
        showAuthModal();
    });

    registerBtn.addEventListener('click', () => {
        isLoginMode = false;
        showAuthModal();
    });

    closeModal.addEventListener('click', hideAuthModal);
    logoutBtn.addEventListener('click', handleLogout);

    switchAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        updateAuthModal();
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isLoginMode) {
            handleLogin();
        } else {
            handleRegister();
        }
    });

    // Outlook için özel kopya butonu
    document.getElementById('outlookCopyBtn').addEventListener('click', function() {
        const signaturePreview = document.getElementById('signaturePreview');
        const htmlContent = signaturePreview.innerHTML;
        
        // İmza içeriğini bir kapsayıcı içine alıyoruz - Outlook için
        const tempDiv = document.createElement('div');
        tempDiv.setAttribute('contenteditable', 'true');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tempDiv);
        
        try {
            // İçeriği tamamen seçiyoruz
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Kopyalama işlemi
            const successful = document.execCommand('copy');
            
            // Sonuç raporu
            if (successful) {
                alert('İmza Outlook için kopyalandı! Outlook\'ta imza ayarlarına yapıştırabilirsiniz.');
            } else {
                throw new Error('Kopyalama işlemi başarısız oldu.');
            }
        } catch (err) {
            console.error('Outlook kopyalama hatası:', err);
            
            // Alternatif bir yöntem deneyelim - kendi kopyalama metodumuzu kullanacağız
            try {
                // İmza HTML içeriğini alalım
                const fullHTML = signaturePreview.outerHTML;
                
                // Clipboarda yazma işlemi (navigator clipboard API)
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(htmlContent)
                        .then(() => {
                            alert('İmza Outlook için kopyalandı! Outlook\'ta imza ayarlarına yapıştırabilirsiniz.');
                        })
                        .catch(err => {
                            console.error('Clipboard API hatası:', err);
                            alert('Kopyalama başarısız oldu. Lütfen manuel olarak seçip kopyalayın.');
                        });
                } else {
                    // Yedek yöntem - textarea ile kopyalama
                    const textarea = document.createElement('textarea');
                    textarea.value = htmlContent;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('İmza Outlook için kopyalandı! Outlook\'ta imza ayarlarına yapıştırabilirsiniz.');
                }
            } catch (backupErr) {
                console.error('Yedek kopyalama hatası:', backupErr);
                alert('Kopyalama başarısız oldu. Lütfen manuel olarak seçip kopyalayın.');
            }
        } finally {
            // Geçici div'i temizle
            document.body.removeChild(tempDiv);
            
            // Seçimi temizle
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }
    });

    // Sayfa yüklendiğinde oturum kontrolü
    await checkAuth();
});

// İmza oluşturma işlevi
function generateSignature() {
    const data = collectFormData();
    const signaturePreview = document.getElementById('signaturePreview');
    const signatureCode = document.getElementById('signatureCode');
    
    // Logo boyut kontrollerinin görünürlüğünü ayarla
    const logoControls = document.querySelector('.logo-size-controls');
    logoControls.style.display = data.logoUrl ? 'block' : 'none';
    
    let signatureHTML = '';
    
    // Font ailesini tırnak içine al ve sistem fontlarını kontrol et
    const systemFonts = ['Arial', 'Georgia', 'Courier New'];
    const fontFamily = systemFonts.includes(data.font) 
        ? data.font 
        : `'${data.font}', sans-serif`;
    
    // Önizleme div'ine font ailesini doğrudan uygula
    signaturePreview.style.fontFamily = fontFamily;
    signaturePreview.style.fontSize = data.fontSize;
    
    switch (data.template) {
        case 'simple':
            signatureHTML = generateSimpleTemplate(data, fontFamily);
            break;
        case 'professional':
            signatureHTML = generateProfessionalTemplate(data, fontFamily);
            break;
        case 'modern':
            signatureHTML = generateModernTemplate(data, fontFamily);
            break;
        case 'minimal':
            signatureHTML = generateMinimalTemplate(data, fontFamily);
            break;
        default:
            signatureHTML = generateSimpleTemplate(data, fontFamily);
    }
    
    signaturePreview.innerHTML = signatureHTML;
    
    // Eğer signatureCode elementi varsa güncelle
    if (signatureCode) {
        signatureCode.textContent = signatureHTML;
    }
}

// Basit şablon oluşturma
function generateSimpleTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize}; padding: 0; margin: 0; mso-line-height-rule: exactly;">`;
    
    // Logo varsa ekle
    if (data.logoUrl) {
        let logoWidth = data.logoSize;
        let logoHeight = data.maintainRatio ? 'auto' : data.logoSize;
        
        html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; margin-bottom: 10px;">
            <tr>
                <td align="left" valign="middle" style="vertical-align: middle;">
                    <img src="${data.logoUrl}" 
                        alt="${data.company || 'Şirket'} Logo" 
                        width="${logoWidth}" 
                        height="${logoHeight}" 
                        style="width: ${logoWidth}px; height: ${logoHeight === 'auto' ? 'auto' : logoHeight + 'px'}; display: inline-block; border: 0; -ms-interpolation-mode: bicubic; outline: none; text-decoration: none; vertical-align: middle;">
                </td>
            </tr>
        </table>`;
    }
    
    // Tablo kullanarak daha uyumlu yapı
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
            <td style="padding: 0 0 5px 0;">
                <div style="color: ${data.primaryColor}; font-weight: bold;">${data.name || 'Ad Soyad'}</div>
            </td>
        </tr>`;
    
    // Pozisyon ve şirket
    if (data.title || data.company) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.title || ''}${data.title && data.company ? ' | ' : ''}${data.company || ''}</div>
            </td>
        </tr>`;
    }
    
    // İletişim bilgileri
    if (data.email || data.phone) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.email || ''}${data.email && data.phone ? ' | ' : ''}${data.phone || ''}</div>
            </td>
        </tr>`;
    }
    
    // Website ve adres
    if (data.website || data.address) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.website || ''}${data.website && data.address ? ' | ' : ''}${data.address || ''}</div>
            </td>
        </tr>`;
    }
    
    // Sosyal medya ikonları
    const socialMedia = [];
    
    if (data.linkedin && data.linkedin.enabled && data.linkedin.url) {
        socialMedia.push(`<a href="${data.linkedin.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.twitter && data.twitter.enabled && data.twitter.url) {
        socialMedia.push(`<a href="${data.twitter.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" 
                alt="Twitter" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.facebook && data.facebook.enabled && data.facebook.url) {
        socialMedia.push(`<a href="${data.facebook.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" 
                alt="Facebook" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.instagram && data.instagram.enabled && data.instagram.url) {
        socialMedia.push(`<a href="${data.instagram.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" 
                alt="Instagram" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (socialMedia.length > 0) {
        html += `<tr>
            <td style="padding: 10px 0 0 0;">
                ${socialMedia.join('')}
            </td>
        </tr>`;
    }
    
    html += `</table>`;
    
    // Yasal uyarı
    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }
    
    html += '</div>';
    return html;
}

// Profesyonel şablon oluşturma
function generateProfessionalTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize}; padding: 0; margin: 0; mso-line-height-rule: exactly;">`;
    
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">`;
    html += '<tr>';
    
    // Logo sütunu
    html += `<td style="vertical-align: middle; width: ${data.logoSize + 20}px; padding-right: 20px; border-right: 3px solid ${data.secondaryColor}; mso-border-right-alt: solid ${data.secondaryColor} 3pt;">`;
    if (data.logoUrl) {
        let logoWidth = data.logoSize;
        let logoHeight = data.maintainRatio ? 'auto' : data.logoSize;
        
        html += `<img src="${data.logoUrl}" 
            alt="${data.company || 'Şirket'} Logo" 
            width="${logoWidth}" 
            height="${logoHeight}" 
            style="width: ${logoWidth}px; height: ${logoHeight === 'auto' ? 'auto' : logoHeight + 'px'}; display: block; margin: 0 auto; border: 0; -ms-interpolation-mode: bicubic; outline: none; text-decoration: none; vertical-align: middle;">`;
    }
    html += '</td>';
    
    // Bilgi sütunu
    html += '<td style="vertical-align: middle; padding-left: 20px;">';
    
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">`;
    
    // Ad Soyad
    html += `<tr>
        <td style="padding: 0 0 5px 0;">
            <div style="color: ${data.primaryColor}; font-weight: bold;">${data.name || ''}</div>
        </td>
    </tr>`;
    
    // Pozisyon | Şirket
    if (data.title || data.company) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div style="color: #777777;">${data.title || ''}${data.title && data.company ? ' | ' : ''}${data.company || ''}</div>
            </td>
        </tr>`;
    }
    
    // E-posta | Telefon
    if (data.email || data.phone) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.email || ''}${data.email && data.phone ? ' | ' : ''}${data.phone || ''}</div>
            </td>
        </tr>`;
    }
    
    // Web sitesi
    if (data.website) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.website}</div>
            </td>
        </tr>`;
    }
    
    // Adres
    if (data.address) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.address}</div>
            </td>
        </tr>`;
    }
    
    // Sosyal medya ikonları
    const socialMedia = [];
    
    if (data.linkedin && data.linkedin.enabled && data.linkedin.url) {
        socialMedia.push(`<a href="${data.linkedin.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.twitter && data.twitter.enabled && data.twitter.url) {
        socialMedia.push(`<a href="${data.twitter.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" 
                alt="Twitter" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.facebook && data.facebook.enabled && data.facebook.url) {
        socialMedia.push(`<a href="${data.facebook.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" 
                alt="Facebook" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.instagram && data.instagram.enabled && data.instagram.url) {
        socialMedia.push(`<a href="${data.instagram.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" 
                alt="Instagram" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (socialMedia.length > 0) {
        html += `<tr>
            <td style="padding: 10px 0 0 0;">
                ${socialMedia.join('')}
            </td>
        </tr>`;
    }
    
    html += `</table>`; // İç tablo kapanışı
    
    html += '</td>'; // Bilgi sütunu kapanışı
    
    html += '</tr></table>'; // Ana tablo kapanışı

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

    html += '</div>'; // Ana div kapanışı
    
    return html;
}

function generateModernTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize}; padding: 0; margin: 0; mso-line-height-rule: exactly;">`;
    
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">`;
    html += '<tr>';
    
    // Sol kenar çizgisi
    html += `<td width="4" style="width: 4px; background-color: ${data.primaryColor}; mso-background-color: ${data.primaryColor}; padding: 0;"></td>`;
    
    // İçerik sütunu
    html += '<td style="padding-left: 10px; vertical-align: top;">';
    
    // Logo
    if (data.logoUrl) {
        let logoWidth = data.logoSize;
        let logoHeight = data.maintainRatio ? 'auto' : data.logoSize;
        
        html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; margin-bottom: 10px;">
            <tr>
                <td align="left" valign="middle" style="vertical-align: middle;">
                    <img src="${data.logoUrl}" 
                        alt="${data.company || 'Şirket'} Logo" 
                        width="${logoWidth}" 
                        height="${logoHeight}" 
                        style="width: ${logoWidth}px; height: ${logoHeight === 'auto' ? 'auto' : logoHeight + 'px'}; display: inline-block; border: 0; -ms-interpolation-mode: bicubic; outline: none; text-decoration: none; vertical-align: middle;">
                </td>
            </tr>
        </table>`;
    }
    
    // Bilgiler için iç tablo
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">`;
    
    // Ad Soyad
    html += `<tr>
        <td style="padding: 0 0 5px 0;">
            <div style="font-weight: bold; font-size: 16px;">${data.name || ''}</div>
        </td>
    </tr>`;
    
    // Pozisyon | Şirket
    if (data.title || data.company) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div style="color: #777777;">${data.title || ''}${data.title && data.company ? ' | ' : ''}${data.company || ''}</div>
            </td>
        </tr>`;
    }
    
    // E-posta | Telefon
    if (data.email || data.phone) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.email || ''}${data.email && data.phone ? ' | ' : ''}${data.phone || ''}</div>
            </td>
        </tr>`;
    }
    
    // Web sitesi
    if (data.website) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.website}</div>
            </td>
        </tr>`;
    }
    
    // Adres
    if (data.address) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.address}</div>
            </td>
        </tr>`;
    }
    
    // Sosyal medya ikonları
    const socialMedia = [];
    
    if (data.linkedin && data.linkedin.enabled && data.linkedin.url) {
        socialMedia.push(`<a href="${data.linkedin.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.twitter && data.twitter.enabled && data.twitter.url) {
        socialMedia.push(`<a href="${data.twitter.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" 
                alt="Twitter" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.facebook && data.facebook.enabled && data.facebook.url) {
        socialMedia.push(`<a href="${data.facebook.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" 
                alt="Facebook" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.instagram && data.instagram.enabled && data.instagram.url) {
        socialMedia.push(`<a href="${data.instagram.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" 
                alt="Instagram" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (socialMedia.length > 0) {
        html += `<tr>
            <td style="padding: 10px 0 0 0;">
                ${socialMedia.join('')}
            </td>
        </tr>`;
    }
    
    html += `</table>`; // İç tablo kapanışı
    
    html += '</td>'; // İçerik sütunu kapanışı
    
    html += '</tr></table>'; // Ana tablo kapanışı

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

    html += '</div>'; // Ana div kapanışı
    
    return html;
}

function generateMinimalTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize}; padding: 0; margin: 0; mso-line-height-rule: exactly;">`;
    
    html += `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">`;
    
    // Logo
    if (data.logoUrl) {
        let logoWidth = data.logoSize;
        let logoHeight = data.maintainRatio ? 'auto' : data.logoSize;
        
        html += `<tr>
            <td style="padding: 0 0 10px 0; vertical-align: middle;" align="left" valign="middle">
                <img src="${data.logoUrl}" 
                    alt="${data.company || 'Şirket'} Logo" 
                    width="${logoWidth}" 
                    height="${logoHeight}" 
                    style="width: ${logoWidth}px; height: ${logoHeight === 'auto' ? 'auto' : logoHeight + 'px'}; display: inline-block; border: 0; -ms-interpolation-mode: bicubic; outline: none; text-decoration: none; vertical-align: middle;">
            </td>
        </tr>`;
    }
    
    // Ad Soyad
    html += `<tr>
        <td style="padding: 0 0 5px 0;">
            <div style="font-weight: bold;">${data.name || ''}</div>
        </td>
    </tr>`;
    
    // Pozisyon, Şirket
    if (data.title || data.company) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div style="color: #777777;">${data.title || ''}${data.title && data.company ? ', ' : ''}${data.company || ''}</div>
            </td>
        </tr>`;
    }
    
    // E-posta
    if (data.email) {
        html += `<tr>
            <td style="padding: 0 0 5px 0;">
                <div>${data.email}</div>
            </td>
        </tr>`;
    }
    
    // Sosyal medya ikonları
    const socialMedia = [];
    
    if (data.linkedin && data.linkedin.enabled && data.linkedin.url) {
        socialMedia.push(`<a href="${data.linkedin.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                alt="LinkedIn" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.twitter && data.twitter.enabled && data.twitter.url) {
        socialMedia.push(`<a href="${data.twitter.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" 
                alt="Twitter" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.facebook && data.facebook.enabled && data.facebook.url) {
        socialMedia.push(`<a href="${data.facebook.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" 
                alt="Facebook" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (data.instagram && data.instagram.enabled && data.instagram.url) {
        socialMedia.push(`<a href="${data.instagram.url}" style="text-decoration: none; margin-right: 10px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" 
                alt="Instagram" 
                width="20" 
                height="20" 
                style="width: 20px; height: 20px; display: inline-block; border: 0; -ms-interpolation-mode: bicubic;">
        </a>`);
    }
    
    if (socialMedia.length > 0) {
        html += `<tr>
            <td style="padding: 10px 0 0 0;">
                ${socialMedia.join('')}
            </td>
        </tr>`;
    }
    
    html += `</table>`; // Tablo kapanışı

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

    html += '</div>'; // Ana div kapanışı
    
    return html;
}

function collectFormData() {
    return {
        name: document.getElementById('name').value,
        title: document.getElementById('title').value,
        company: document.getElementById('company').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        website: document.getElementById('website').value,
        address: document.getElementById('address').value,
        template: document.getElementById('template').value,
        font: document.getElementById('font').value,
        fontSize: document.getElementById('fontSize').value,
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        logoUrl: document.getElementById('logoUrl').value,
        avatarUrl: document.getElementById('avatarUrl').value,
        disclaimer: document.getElementById('disclaimer').value,
        logoSize: logoSize,
        maintainRatio: maintainRatio,
        linkedin: {
            enabled: document.getElementById('linkedin').checked,
            url: document.getElementById('linkedinUrl').value
        },
        twitter: {
            enabled: document.getElementById('twitter').checked,
            url: document.getElementById('twitterUrl').value
        },
        facebook: {
            enabled: document.getElementById('facebook').checked,
            url: document.getElementById('facebookUrl').value
        },
        instagram: {
            enabled: document.getElementById('instagram').checked,
            url: document.getElementById('instagramUrl').value
        }
    };
}

// Kaydedilen imzaların listesini güncelle
async function updateSavedSignaturesList() {
    const savedSignaturesList = document.getElementById('savedSignaturesList');
    
    try {
        // İlk olarak yükleniyor mesajı göster
        savedSignaturesList.innerHTML = '<p>İmzalar yükleniyor...</p>';
        
        // Yerel imzaları al
        const localSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        console.log('Yerel imzalar sayısı:', localSignatures.length);
        
        // Bulut imzalarını al (eğer kullanıcı giriş yapmışsa)
        let cloudSignatures = [];
        if (currentUser && currentUser.token) {
            try {
                console.log('Bulut imzalarını yüklemeye başlanıyor...');
                cloudSignatures = await loadSignaturesFromCloud();
                console.log('Bulut imzaları başarıyla yüklendi, imza sayısı:', Array.isArray(cloudSignatures) ? cloudSignatures.length : 'Dizi değil');
                
                // Olası özel veri yapılarını kontrol et
                if (!Array.isArray(cloudSignatures) && typeof cloudSignatures === 'object') {
                    console.warn('Yüklenen bulut imzaları bir dizi değil, olası alanları kontrol ediliyor');
                    
                    // Olası dizi alanlarını kontrol et
                    const possibleArrayFields = ['signatures', 'items', 'data', 'results'];
                    for (const field of possibleArrayFields) {
                        if (cloudSignatures[field] && Array.isArray(cloudSignatures[field])) {
                            console.log(`'${field}' alanından dizi bulundu, eleman sayısı:`, cloudSignatures[field].length);
                            cloudSignatures = cloudSignatures[field];
                            break;
                        }
                    }
                    
                    // Hala dizi değilse, nesneyi diziye dönüştürmeyi dene
                    if (!Array.isArray(cloudSignatures)) {
                        console.warn('Diziye dönüşüm başarısız, nesneyi diziye çevirme deneniyor');
                        const entries = Object.entries(cloudSignatures);
                        // Her giriş [id, veri] ise
                        if (entries.length > 0 && typeof entries[0][1] === 'object') {
                            cloudSignatures = entries.map(([id, data]) => ({
                                id,
                                ...data
                            }));
                            console.log('Nesneden dönüştürülen dizi sayısı:', cloudSignatures.length);
                        } else {
                            // Son çare
                            console.error('Nesne dizi formatına dönüştürülemedi, boş dizi kullanılıyor');
                            cloudSignatures = [];
                        }
                    }
                }
                
                // Data integrity check - Her imzanın gerekli alanları var mı?
                if (Array.isArray(cloudSignatures)) {
                    const originalLength = cloudSignatures.length;
                    cloudSignatures = cloudSignatures.filter(signature => {
                        // En azından id ve html kontrolü
                        if (!signature) {
                            console.warn('null veya undefined imza verisi yoksayıldı');
                            return false;
                        }
                        
                        if (!signature.id) {
                            console.warn('ID değeri olmayan imza yoksayıldı:', JSON.stringify(signature).substring(0, 50) + '...');
                            return false;
                        }
                        
                        if (!signature.html) {
                            console.warn('HTML içeriği olmayan imza yoksayıldı, ID:', signature.id);
                            return false;
                        }
                        
                        return true;
                    });
                    
                    if (originalLength !== cloudSignatures.length) {
                        console.log(`Veri doğrulama sonrası ${originalLength} imzadan ${cloudSignatures.length} tanesi kaldı.`);
                    }
                } else {
                    console.error('Bulut imzaları dizi formatında değil, boş dizi kullanılıyor');
                    cloudSignatures = [];
                }
                
                console.log('İşlenmiş bulut imzaları sayısı:', cloudSignatures.length);
            } catch (error) {
                console.error('Buluttan imzalar yüklenemedi:', error);
                // Hata mesajını göster
                savedSignaturesList.innerHTML = `
                    <div class="error-message">
                        <p><strong>Bulut imzaları yüklenirken hata oluştu:</strong> ${error.message}</p>
                        <p>Yerel imzalarınız gösteriliyor.</p>
                    </div>`;
                
                // 3 saniye sonra sadece yerel imzaları göster
                setTimeout(() => {
                    renderSignaturesList(localSignatures, []);
                }, 3000);
                return;
            }
        } else {
            console.log('Kullanıcı giriş yapmamış, sadece yerel imzalar kullanılıyor');
        }
        
        // İmzaları göster
        renderSignaturesList(localSignatures, cloudSignatures);
        
    } catch (error) {
        console.error('İmza listesi güncellenirken hata:', error);
        savedSignaturesList.innerHTML = `
            <div class="error-message">
                <p><strong>İmzalar yüklenirken bir hata oluştu:</strong> ${error.message}</p>
                <p>Lütfen sayfayı yenileyin ve tekrar deneyin.</p>
            </div>`;
    }
}

// İmza listesini oluştur
function renderSignaturesList(localSignatures, cloudSignatures) {
    const savedSignaturesList = document.getElementById('savedSignaturesList');
    
    // İmza yok ise bilgi mesajı göster
    if (localSignatures.length === 0 && cloudSignatures.length === 0) {
        savedSignaturesList.innerHTML = '<p>Henüz kaydedilmiş imza bulunmuyor.</p>';
        return;
    }
    
    let html = '<div class="saved-signatures-container">';
    
    // Bulut imzaları göster
    if (cloudSignatures && cloudSignatures.length > 0) {
        html += '<h4>Bulut İmzalarınız</h4>';
        html += '<div class="saved-signatures-grid">';
        
        try {
            cloudSignatures.forEach((signature) => {
                try {
                    if (!signature || !signature.id) {
                        console.warn('Geçersiz bulut imzası, atlanıyor:', signature);
                        return; // forEach içinde continue gibi davranır
                    }
                    
                    // Bu imza güvenli bir şekilde eklenebilir mi?
                    const signatureName = signature.name || 'İsimsiz İmza';
                    const signatureHtml = signature.html || '<div>İmza içeriği yüklenemedi</div>';
                    
                    html += `
                        <div class="saved-signature" data-id="${signature.id}" data-type="cloud">
                            <div class="signature-name">${signatureName}</div>
                            <div class="signature-preview">${signatureHtml}</div>
                            <div class="signature-actions">
                                <button class="load-signature" data-id="${signature.id}" data-type="cloud">Yükle</button>
                                <button class="delete-signature" data-id="${signature.id}" data-type="cloud">Sil</button>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error('Bir bulut imzası işlenirken hata:', err, signature);
                }
            });
        } catch (err) {
            console.error('Bulut imzaları işlenirken hata oluştu:', err);
            html += '<p>Bulut imzaları gösterilirken bir hata oluştu.</p>';
        }
        
        html += '</div>';
    }
    
    // Yerel imzaları göster
    if (localSignatures && localSignatures.length > 0) {
        html += '<h4>Yerel İmzalarınız</h4>';
        html += '<div class="saved-signatures-grid">';
        
        try {
            localSignatures.forEach((signature, index) => {
                try {
                    // Bu imza güvenli bir şekilde eklenebilir mi?
                    const signatureName = signature.name || 'İsimsiz İmza';
                    const signatureHtml = signature.html || '<div>İmza içeriği yüklenemedi</div>';
                    
                    html += `
                        <div class="saved-signature" data-index="${index}" data-type="local">
                            <div class="signature-name">${signatureName}</div>
                            <div class="signature-preview">${signatureHtml}</div>
                            <div class="signature-actions">
                                <button class="load-signature" data-index="${index}" data-type="local">Yükle</button>
                                <button class="delete-signature" data-index="${index}" data-type="local">Sil</button>
                                ${currentUser && currentUser.token ? `<button class="upload-signature" data-index="${index}">Buluta Yükle</button>` : ''}
                            </div>
                        </div>
                    `;
                } catch (err) {
                    console.error('Bir yerel imza işlenirken hata:', err, signature);
                }
            });
        } catch (err) {
            console.error('Yerel imzalar işlenirken hata oluştu:', err);
            html += '<p>Yerel imzalar gösterilirken bir hata oluştu.</p>';
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    savedSignaturesList.innerHTML = html;
    
    // Yükle, sil ve buluta yükle butonları için event listener'ları ekle
    addSignatureEventListeners();
}

// İmza listesi olaylarını ekle
function addSignatureEventListeners() {
    document.querySelectorAll('.load-signature').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            if (type === 'local') {
                const index = parseInt(this.getAttribute('data-index'));
                loadSignatureFromLocal(index);
            } else if (type === 'cloud') {
                const id = this.getAttribute('data-id');
                loadSignatureFromCloud(id);
            }
        });
    });
    
    document.querySelectorAll('.delete-signature').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            if (type === 'local') {
                const index = parseInt(this.getAttribute('data-index'));
                deleteSignatureFromLocal(index);
            } else if (type === 'cloud') {
                const id = this.getAttribute('data-id');
                deleteSignatureFromCloudUI(id);
            }
        });
    });
    
    document.querySelectorAll('.upload-signature').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            uploadLocalSignatureToCloud(index);
        });
    });
}

// İmza yükleme fonksiyonu
function loadSignatureFromLocal(index) {
    const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    if (index >= 0 && index < savedSignatures.length) {
        const signature = savedSignatures[index];
        loadSignatureToForm(signature);
    }
}

// Buluttan imza yükleme
async function loadSignaturesFromCloud() {
    try {
        if (!currentUser || !currentUser.token) {
            throw new Error('Kullanıcı giriş yapmamış');
        }
        
        console.log('Bulut imzalarını yüklemeye başlıyor... Token:', currentUser.token?.substring(0, 10) + '...');
        
        const response = await fetch(`${API_URL}/users/signatures`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        console.log('API Yanıtı Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Hata Yanıt Metni:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                console.error('API Hata Detayı:', errorData);
                throw new Error(errorData.error || 'İmzalar yüklenemedi');
            } catch (parseError) {
                console.error('Hata yanıtı JSON değil:', parseError);
                throw new Error(`İmzalar yüklenemedi. Status: ${response.status}, Yanıt: ${errorText.substring(0, 100)}...`);
            }
        }
        
        const responseText = await response.text();
        console.log('API Yanıt (ham metin):', responseText.substring(0, 200) + '...');
        
        // Boş yanıt kontrolü
        if (!responseText || responseText.trim() === '') {
            console.log('API boş yanıt döndü, boş dizi kullanılıyor');
            return [];
        }
        
        try {
            const signatures = JSON.parse(responseText);
            console.log('İşlenen imzalar türü:', typeof signatures);
            
            if (typeof signatures === 'object') {
                console.log('İmzalar obje anahtarları:', Object.keys(signatures));
            }
            
            if (Array.isArray(signatures)) {
                console.log('Dizi uzunluğu:', signatures.length);
                if (signatures.length > 0) {
                    console.log('İlk imza örneği:', JSON.stringify(signatures[0]).substring(0, 100) + '...');
                }
                return signatures;
            } else if (signatures.signatures && Array.isArray(signatures.signatures)) {
                console.log('signatures alanı dizi uzunluğu:', signatures.signatures.length);
                return signatures.signatures;
            } else if (signatures.items && Array.isArray(signatures.items)) {
                console.log('items alanı dizi uzunluğu:', signatures.items.length);
                return signatures.items;
            } else if (signatures.data && Array.isArray(signatures.data)) {
                console.log('data alanı dizi uzunluğu:', signatures.data.length);
                return signatures.data;
            } else {
                console.warn('Beklenmeyen API yanıt formatı:', JSON.stringify(signatures).substring(0, 100) + '...');
                
                // Objeden dizi çıkarma denemeleri
                if (typeof signatures === 'object') {
                    // Anahtar-değer çiftlerinden dizi oluşturma
                    const entries = Object.entries(signatures);
                    if (entries.length > 0 && typeof entries[0][1] === 'object') {
                        console.log('Objeden dizi oluşturuluyor, anahtar-değer çiftlerinden');
                        const signatureArray = entries.map(([id, data]) => ({
                            id,
                            ...data
                        }));
                        console.log('Oluşturulan dizi uzunluğu:', signatureArray.length);
                        return signatureArray;
                    }
                    
                    // Objedeki tüm dizi türündeki değerleri bul
                    const arrayValues = Object.values(signatures).filter(val => Array.isArray(val));
                    if (arrayValues.length > 0) {
                        console.log('Objeden ilk dizi değeri kullanılıyor, uzunluk:', arrayValues[0].length);
                        return arrayValues[0];
                    }
                }
                
                console.error('Dizi formatına dönüştürülemedi, boş dizi döndürülüyor');
                return [];
            }
        } catch (parseError) {
            console.error('JSON parse hatası:', parseError);
            throw new Error('API yanıtı geçerli JSON değil: ' + responseText.substring(0, 50) + '...');
        }
    } catch (error) {
        console.error('Buluttan yükleme hatası:', error);
        throw error;
    }
}

// Buluttan tekil imza yükleme
async function loadSignatureFromCloud(id) {
    try {
        if (!currentUser || !currentUser.token) {
            alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
            return;
        }
        
        console.log('Buluttan imza yükleniyor, ID:', id);
        
        const response = await fetch(`${API_URL}/users/signatures/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        console.log('Tekil imza API yanıtı status:', response.status);
        
        // Önce response'u text olarak al
        const responseText = await response.text();
        console.log('Tekil imza yanıtı (ham):', responseText);
        
        if (!response.ok) {
            // Eğer yanıt başarısız ve JSON formatındaysa, hata detayını göster
            try {
                const errorData = JSON.parse(responseText);
                console.error('Tekil imza yükleme hatası:', errorData);
                throw new Error(errorData.error || `İmza yüklenemedi (${response.status}: ${response.statusText})`);
            } catch (parseError) {
                // JSON parse edilemiyorsa ham hata mesajını göster
                console.error('Yanıt JSON formatında değil:', parseError);
                throw new Error(`İmza yüklenemedi (${response.status}: ${response.statusText})`);
            }
        }
        
        // Boş yanıt kontrolü
        if (!responseText || responseText.trim() === '') {
            console.error('API boş yanıt döndü');
            throw new Error('API boş yanıt döndü');
        }
        
        // JSON parse etmeyi dene
        try {
            // API'den gelen yanıtı parse et
            const responseData = JSON.parse(responseText);
            console.log('İmza verisi alındı:', responseData);
            
            // API'den gelen data'yı doğru formata çevir
            let signature;
            
            // Gelen veri doğrudan bir imza objesi ise
            if (responseData && responseData.id && responseData.html) {
                signature = responseData;
            } 
            // Eğer bir settings objesi içeriyorsa
            else if (responseData && responseData.settings) {
                signature = {
                    ...responseData.settings,
                    name: responseData.name,
                    html: responseData.html,
                    id: responseData.id
                };
            } 
            // Hiçbir bilinen formatta değilse
            else {
                console.error('Beklenmeyen imza formatı:', responseData);
                throw new Error('Beklenmeyen imza formatı, form doldurulamadı');
            }
            
            console.log('İmza işlendi ve form dolduruluyor:', signature);
            
            // Form alanlarını güncelle
            switchTab('editor'); // Önce editör sekmesine geç
            loadSignatureToForm(signature);
            
            // İmzayı tekrar oluştur
            generateSignature();
            
            // Kullanıcıya bilgi ver
            alert(`"${signature.name || 'İsimsiz imza'}" başarıyla yüklendi ve düzenleyicide açıldı.`);
        } catch (parseError) {
            console.error('JSON parse hatası:', parseError, 'Ham yanıt:', responseText);
            throw new Error('API yanıtı geçerli JSON değil');
        }
    } catch (error) {
        console.error('Buluttan imza yükleme hatası:', error);
        alert('İmza yüklenemedi: ' + error.message);
    }
}

// Form verilerini doldur
function loadSignatureToForm(signature) {
    console.log('loadSignatureToForm çağrıldı, gelen veri:', signature);
    
    try {
        // Öğeleri sıfırlayalım, böylece önceki veriler karışmaz
        resetForm();
        
        // İmza adını doldur
        if (signature.name) {
            document.getElementById('name').value = signature.name;
        }
        
        // HTML içeriğini parse et (base64 logoyu da içerebilir)
        const htmlContent = signature.html;
        
        // İmza HTML'ini doğrudan önizlemeye ekleyelim
        document.getElementById('signaturePreview').innerHTML = htmlContent;
        
        // HTML'i parse edelim
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Şablonu belirle - imza yapısını kontrol ederek
        let detectedTemplate = 'simple'; // varsayılan
        
        // Modern şablon kontrolü - kenarlık varsa
        if (doc.querySelector('td[style*="border-right:"], td[style*="border-left:"], div[style*="border-left:"]')) {
            detectedTemplate = 'modern';
        } 
        // Profesyonel şablon kontrolü - yan yana yerleşim varsa
        else if (doc.querySelector('table tr td img') && doc.querySelectorAll('table tr td').length > 1) {
            detectedTemplate = 'professional';
        }
        // Minimal şablon kontrolü - daha az bilgi içeren bir yapı
        else if (doc.querySelectorAll('tr').length <= 3) {
            detectedTemplate = 'minimal';
        }
        
        // Şablon seçimini güncelle
        document.getElementById('template').value = detectedTemplate;
        document.querySelectorAll('.template').forEach(template => {
            template.classList.remove('selected');
            if (template.getAttribute('data-template') === detectedTemplate) {
                template.classList.add('selected');
            }
        });
        
        console.log('Tespit edilen şablon:', detectedTemplate);
        
        // Tüm metin içeriğini çıkaralım
        const allTextContent = doc.querySelectorAll('div, span, p, td');
        const allTexts = Array.from(allTextContent).map(el => el.textContent.trim()).filter(t => t);
        
        console.log('İmzadaki tüm metinler:', allTexts);
        
        // İmzadan tüm bilgileri çıkarmak için metin analizi
        if (allTexts.length > 0) {
            // Ad soyad genellikle ilk metindir veya en belirgin metin
            if (!signature.name && allTexts[0]) {
                document.getElementById('name').value = allTexts[0];
            }
            
            // Diğer metinleri analiz et
            for (let i = 1; i < allTexts.length; i++) {
                const text = allTexts[i];
                
                // E-posta adresi kontrolü
                if (text.includes('@') && text.includes('.')) {
                    document.getElementById('email').value = text.split('|')[0].trim();
                }
                
                // Telefon numarası kontrolü
                else if (/(\+\d{1,3}|\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/.test(text)) {
                    const phoneMatch = text.match(/(\+\d{1,3}|\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/);
                    if (phoneMatch) {
                        document.getElementById('phone').value = phoneMatch[0].trim();
                    }
                }
                
                // Pozisyon/Şirket bilgisi
                else if (text.includes('|')) {
                    const parts = text.split('|').map(part => part.trim());
                    
                    // Tipik olarak "Pozisyon | Şirket" formatında
                    if (parts.length >= 2) {
                        document.getElementById('title').value = parts[0];
                        document.getElementById('company').value = parts[1];
                    }
                }
                
                // Website kontrolü
                else if (text.includes('www.') || text.includes('http')) {
                    document.getElementById('website').value = text.trim();
                }
                
                // Uzun metin muhtemelen adres
                else if (text.length > 20 && text.includes(',')) {
                    document.getElementById('address').value = text;
                }
                // Alternatif adres tespiti - birden fazla satır veya boşluk içeren metinler
                else if ((text.length > 20 && (text.includes('\n') || text.split(' ').length > 4)) && !document.getElementById('address').value) {
                    document.getElementById('address').value = text;
                }
                
                // Tek kelime ve ilk metin değilse muhtemelen pozisyon
                else if (text.split(' ').length <= 3 && !document.getElementById('title').value) {
                    document.getElementById('title').value = text;
                }
                
                // Çok kelimeli ve adres değilse muhtemelen şirket
                else if (text.split(' ').length > 1 && !document.getElementById('company').value) {
                    document.getElementById('company').value = text;
                }
            }
        }
        
        // HTML içinde doğrudan adres bulma girişimi (genel metinlerden bulunamadıysa)
        if (!document.getElementById('address').value) {
            // Adres genellikle bir div veya td içinde olur
            const possibleAddressElements = Array.from(doc.querySelectorAll('div, td')).filter(el => {
                const content = el.textContent.trim();
                return content.length > 20 && (content.includes(',') || content.split(' ').length > 5);
            });
            
            if (possibleAddressElements.length > 0) {
                document.getElementById('address').value = possibleAddressElements[0].textContent.trim();
            }
        }
        
        // Sosyal medya bağlantılarını kontrol et
        const socialLinks = doc.querySelectorAll('a[href]');
        for (const link of socialLinks) {
            const href = link.getAttribute('href');
            
            if (href.includes('linkedin.com')) {
                document.getElementById('linkedin').checked = true;
                document.getElementById('linkedinUrl').value = href;
            } else if (href.includes('twitter.com') || href.includes('x.com')) {
                document.getElementById('twitter').checked = true;
                document.getElementById('twitterUrl').value = href;
            } else if (href.includes('facebook.com')) {
                document.getElementById('facebook').checked = true;
                document.getElementById('facebookUrl').value = href;
            } else if (href.includes('instagram.com')) {
                document.getElementById('instagram').checked = true;
                document.getElementById('instagramUrl').value = href;
            }
        }
        
        // Sosyal medya görünürlüğünü güncelle
        updateSocialLinksVisibility();
        
        // Font ailesini al
        const fontStyles = doc.querySelector('div[style*="font-family"]');
        if (fontStyles) {
            const styleAttr = fontStyles.getAttribute('style');
            const fontFamilyMatch = styleAttr.match(/font-family:\s*['"]?([^'";]+)/);
            
            if (fontFamilyMatch && fontFamilyMatch[1]) {
                const fontFamily = fontFamilyMatch[1].replace(/['",]/g, '').trim().split(/,\s*/)[0];
                const fontSelect = document.getElementById('font');
                
                // Font seçimi
                for (let i = 0; i < fontSelect.options.length; i++) {
                    if (fontSelect.options[i].value.toLowerCase() === fontFamily.toLowerCase()) {
                        fontSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            
            // Font boyutunu al
            const fontSizeMatch = styleAttr.match(/font-size:\s*([^;]+)/);
            if (fontSizeMatch && fontSizeMatch[1]) {
                const fontSize = fontSizeMatch[1].trim();
                const fontSizeSelect = document.getElementById('fontSize');
                
                // Font boyutu seçimi
                for (let i = 0; i < fontSizeSelect.options.length; i++) {
                    if (fontSizeSelect.options[i].value === fontSize) {
                        fontSizeSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        // Renkleri al - önce birincil renk
        const colorElement = doc.querySelector('div[style*="color:"]');
        if (colorElement) {
            const styleAttr = colorElement.getAttribute('style');
            const colorMatch = styleAttr.match(/color:\s*([^;]+)/);
            
            if (colorMatch && colorMatch[1]) {
                const color = colorMatch[1].trim();
                document.getElementById('primaryColor').value = color;
                document.getElementById('primaryColorHex').value = color;
            }
        }
        
        // İkincil renk - kenar çizgisi
        const borderStyle = doc.querySelector('[style*="border-right:"], [style*="border-left:"]');
        if (borderStyle) {
            const styleAttr = borderStyle.getAttribute('style');
            const borderColorMatch = styleAttr.match(/border-(right|left):\s*\d+px\s*solid\s*([^;]+)/);
            
            if (borderColorMatch && borderColorMatch[2]) {
                const secondaryColor = borderColorMatch[2].trim();
                document.getElementById('secondaryColor').value = secondaryColor;
                document.getElementById('secondaryColorHex').value = secondaryColor;
            }
        }
        
        // İmzada logo varsa
        const logoImg = doc.querySelector('img');
        if (logoImg) {
            const logoSrc = logoImg.getAttribute('src');
            document.getElementById('logoUrl').value = logoSrc;
            
            // Logo boyutunu ayarla
            if (logoImg.hasAttribute('width')) {
                const logoWidth = parseInt(logoImg.getAttribute('width'));
                if (!isNaN(logoWidth)) {
                    logoSize = logoWidth;
                    document.getElementById('logoSize').value = logoSize;
                    document.getElementById('logoSizeValue').textContent = logoSize + 'px';
                }
            }
            
            // Logo kontrol panelini göster
            const logoControls = document.querySelector('.logo-size-controls');
            logoControls.style.display = 'block';
        }
        
        // Yasal uyarı metni kontrolü
        const smallTexts = doc.querySelectorAll('div[style*="font-size: 10px"], div[style*="font-size:10px"]');
        if (smallTexts.length > 0) {
            document.getElementById('disclaimer').value = smallTexts[0].textContent.trim();
        }
        
        // İmzayı tekrar oluştur
        setTimeout(() => {
            generateSignature();
            console.log('Form alanları başarıyla dolduruldu ve imza oluşturuldu');
        }, 100);
        
    } catch (error) {
        console.error('Form doldurma hatası:', error);
        alert('İmza yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Form alanlarını sıfırla
function resetForm() {
    // Temel bilgileri temizle
    document.getElementById('title').value = '';
    document.getElementById('company').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('website').value = '';
    document.getElementById('address').value = '';
    
    // Sosyal medya ayarlarını sıfırla
    ['linkedin', 'twitter', 'facebook', 'instagram'].forEach(social => {
        document.getElementById(social).checked = false;
        document.getElementById(`${social}Url`).value = '';
    });
    
    // Sosyal medya input alanlarını gizle
    document.getElementById('socialLinksContainer').style.display = 'none';
    
    // Logo ve avatar ayarlarını sıfırla
    document.getElementById('logoUrl').value = '';
    document.getElementById('avatarUrl').value = '';
    document.getElementById('disclaimer').value = '';
    
    // Logo kontrollerini gizle
    document.querySelector('.logo-size-controls').style.display = 'none';
}

// İmza silme fonksiyonu
function deleteSignatureFromLocal(index) {
    if (confirm('Bu imzayı silmek istediğinizden emin misiniz?')) {
        const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        savedSignatures.splice(index, 1);
        localStorage.setItem('emailSignatures', JSON.stringify(savedSignatures));
        updateSavedSignaturesList();
    }
}

// Bulut imzasını silme UI
async function deleteSignatureFromCloudUI(id) {
    if (confirm('Bu imzayı buluttan silmek istediğinizden emin misiniz?')) {
        try {
            await deleteSignatureFromCloud(id);
            alert('İmza başarıyla silindi');
            updateSavedSignaturesList();
        } catch (error) {
            console.error('İmza silme hatası:', error);
            alert('İmza silinemedi: ' + error.message);
        }
    }
}

// Yerel imzayı buluta yükleme
async function uploadLocalSignatureToCloud(index) {
    try {
        if (!currentUser || !currentUser.token) {
            throw new Error('Kullanıcı giriş yapmamış');
        }
        
        const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        if (index >= 0 && index < savedSignatures.length) {
            const signature = savedSignatures[index];
            
            await saveSignatureToCloud(signature);
            alert(`"${signature.name}" imzası başarıyla buluta yüklendi!`);
            updateSavedSignaturesList();
        }
    } catch (error) {
        console.error('Buluta yükleme hatası:', error);
        alert('İmza buluta yüklenemedi: ' + error.message);
    }
}

function switchTab(tabId) {
    // Aktif tab sınıfını güncelle
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Tab içeriğini göster/gizle
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function updateSocialLinksVisibility() {
    const socialLinksContainer = document.getElementById('socialLinksContainer');
    const linkedinLink = document.querySelector('.linkedin-link');
    const twitterLink = document.querySelector('.twitter-link');
    const facebookLink = document.querySelector('.facebook-link');
    const instagramLink = document.querySelector('.instagram-link');
    
    const linkedinChecked = document.getElementById('linkedin').checked;
    const twitterChecked = document.getElementById('twitter').checked;
    const facebookChecked = document.getElementById('facebook').checked;
    const instagramChecked = document.getElementById('instagram').checked;
    
    // Sosyal medya linklerini göster/gizle
    linkedinLink.style.display = linkedinChecked ? 'block' : 'none';
    twitterLink.style.display = twitterChecked ? 'block' : 'none';
    facebookLink.style.display = facebookChecked ? 'block' : 'none';
    instagramLink.style.display = instagramChecked ? 'block' : 'none';
    
    // Eğer en az bir sosyal medya seçiliyse container'ı göster
    socialLinksContainer.style.display = (linkedinChecked || twitterChecked || facebookChecked || instagramChecked) ? 'block' : 'none';
}

// Kullanıcı Yönetimi Fonksiyonları
function showAuthModal() {
    updateAuthModal();
    authModal.style.display = 'block';
}

function hideAuthModal() {
    authModal.style.display = 'none';
    authForm.reset();
}

function updateAuthModal() {
    if (isLoginMode) {
        modalTitle.textContent = 'Giriş Yap';
        authSubmitBtn.textContent = 'Giriş Yap';
        authNameGroup.style.display = 'none';
        switchAuthMode.textContent = 'Hesabınız yok mu? Kayıt olun';
    } else {
        modalTitle.textContent = 'Kayıt Ol';
        authSubmitBtn.textContent = 'Kayıt Ol';
        authNameGroup.style.display = 'block';
        switchAuthMode.textContent = 'Zaten hesabınız var mı? Giriş yapın';
    }
}

// Kullanıcı kaydı
async function registerUser(email, password, name) {
    try {
        // E-posta formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Geçerli bir e-posta adresi girmelisiniz');
        }
        
        // Şifre gereksinimleri kontrolü
        if (password.length < 8) {
            throw new Error('Şifre en az 8 karakter uzunluğunda olmalıdır');
        }
        
        // Şifre karmaşıklık kontrolü
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!(hasUpperCase && hasLowerCase && hasNumbers) && !hasSpecialChar) {
            throw new Error('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli veya özel karakter içermelidir');
        }
        
        // Ad boş olmamalı
        if (!name || name.trim() === '') {
            throw new Error('Ad alanı boş olamaz');
        }
        
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Kayıt işlemi sırasında bir hata oluştu');
        }
        
        return data;
    } catch (error) {
        console.error('Kayıt hatası:', error);
        throw error;
    }
}

// Kullanıcı girişi
async function loginUser(email, password) {
    try {
        // E-posta formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Geçerli bir e-posta adresi girmelisiniz');
        }
        
        // Şifre boş olmamalı
        if (!password || password.trim() === '') {
            throw new Error('Şifre alanı boş olamaz');
        }
        
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Giriş işlemi sırasında bir hata oluştu');
        }
        
        return data;
    } catch (error) {
        console.error('Giriş hatası:', error);
        throw error;
    }
}

// Kullanıcı işlemleri için fonksiyonlar
async function handleRegister() {
    try {
        const email = authEmail.value.trim();
        const password = authPassword.value;
        const name = authName.value.trim();
        
        // Kayıt işlemini başlat
        const result = await registerUser(email, password, name);
        
        // Doğrulama kodu formunu göster
        authEmail.disabled = true;
        authPassword.disabled = true;
        authName.disabled = true;
        verificationCodeGroup.style.display = 'block';
        authSubmitBtn.textContent = 'Doğrula';
        
        // Form gönderildiğinde artık doğrulama işlemi yapılacak
        authForm.onsubmit = async function(e) {
            e.preventDefault();
            const code = document.getElementById('verificationCode').value.trim();
            
            if (!code) {
                alert('Lütfen doğrulama kodunu giriniz');
                return;
            }
            
            try {
                await verifyEmail(email, code);
            } catch (error) {
                console.error('Doğrulama hatası:', error);
            }
        };
        
        alert('Kayıt işlemi başarılı! Lütfen e-posta adresinize gelen doğrulama kodunu giriniz.');
    } catch (error) {
        alert('Kayıt başarısız: ' + error.message);
    }
}

async function handleLogin() {
    const email = authEmail.value;
    const password = authPassword.value;
    
    try {
        const user = await loginUser(email, password);
        currentUser = user;
        localStorage.setItem('userToken', user.token);
        updateUI();
        hideAuthModal();
        alert('Giriş başarılı!');
        
        // İmza listesini güncelle
        await updateSavedSignaturesList();
        
        // Ayarlar sekmesini aç
        switchTab('settings');
    } catch (error) {
        alert('Giriş başarısız: ' + error.message);
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('userToken');
    updateUI();
    
    // İmza listesini güncelle
    updateSavedSignaturesList();
    
    alert('Çıkış yapıldı!');
}

// Kullanıcı oturum kontrolü
async function checkAuth() {
    const token = localStorage.getItem('userToken');
    
    if (!token) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            // Token geçersiz veya süresi dolmuş
            localStorage.removeItem('userToken');
            return;
        }
        
        const data = await response.json();
        currentUser = data;
        currentUser.token = token; // Token'ı da kaydet
        updateUI();
        
        // İmza listesini güncelle
        await updateSavedSignaturesList();
    } catch (error) {
        console.error('Oturum kontrolü hatası:', error);
        localStorage.removeItem('userToken');
    }
}

// Kullanıcı arayüzünü güncelleme
function updateUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name || currentUser.email || 'Kullanıcı';
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Doğrulama kodu kontrolü
async function verifyEmail(email, code) {
    try {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Doğrulanıyor...';
        
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });
        
        console.log('Doğrulama yanıtı status:', response.status);
        
        if (!response.ok) {
            const data = await response.json();
            console.error('Doğrulama hatası yanıtı:', data);
            throw new Error(data.error || 'Doğrulama işlemi sırasında bir hata oluştu');
        }
        
        const data = await response.json();
        console.log('Doğrulama başarılı, yanıt:', data);
        
        // Kullanıcı bilgilerini ve token'ı kaydet
        if (data.user && data.token) {
            currentUser = data.user;
            currentUser.token = data.token;
            localStorage.setItem('userToken', data.token);
        } else if (data.token) {
            // Sadece token var, kullanıcı bilgisi sonra alınacak
            localStorage.setItem('userToken', data.token);
            // Token'ı kullanarak kullanıcı bilgisini çek
            await checkAuth();
        } else {
            throw new Error('Doğrulama başarılı ancak token bulunamadı');
        }
        
        // UI'ı güncelle
        updateUI();
        hideAuthModal();
        
        alert('Hesabınız başarıyla doğrulandı!');
        return data;
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        alert('Doğrulama başarısız: ' + error.message);
        
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = 'Doğrula';
        
        throw error;
    }
}

// HTML formatı için yardımcı fonksiyon
function formatHTML(html) {
    let formatted = '';
    let indent = '';
    
    html.split(/>\s*</).forEach(function(element) {
        if (element.match(/^\/\w/)) {
            // Kapanan tag
            indent = indent.substring(2);
        }
        
        formatted += indent + '<' + element + '>\r\n';
        
        if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input") && !element.startsWith("img")) {
            // Açılan tag ve self-closing olmayan
            indent += '  ';
        }
    });
    
    return formatted.substring(1, formatted.length - 3);
}

// Yerel olarak imza kaydetme
function saveSignatureLocally(signatureData) {
    let savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    savedSignatures.push(signatureData);
    localStorage.setItem('emailSignatures', JSON.stringify(savedSignatures));
}

// Buluta imza kaydetme
async function saveSignatureToCloud(signatureData) {
    try {
        const response = await fetch(`${API_URL}/users/signatures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(signatureData)
        });
        
        console.log('İmza kaydetme yanıtı status:', response.status);
        
        if (!response.ok) {
            const data = await response.json();
            console.error('İmza kaydetme hatası:', data);
            throw new Error(data.error || 'İmza kaydedilemedi');
        }
        
        const data = await response.json();
        console.log('İmza kaydetme başarılı, yanıt:', data);
        return data;
    } catch (error) {
        console.error('Buluta kaydetme hatası:', error);
        throw error;
    }
}

// Buluttan imza silme
async function deleteSignatureFromCloud(signatureId) {
    try {
        console.log('İmza siliniyor, ID:', signatureId);
        
        const response = await fetch(`${API_URL}/users/signatures/${signatureId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        console.log('İmza silme API yanıtı status:', response.status);
        
        // Önce yanıtı metin olarak al
        const responseText = await response.text();
        console.log('İmza silme API yanıtı (ham):', responseText);
        
        if (!response.ok) {
            // Yanıt başarısız, hata mesajını çıkar
            let errorMessage = 'İmza silinemedi';
            
            if (responseText) {
                try {
                    // Yanıt JSON mu diye kontrol et
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || 'İmza silinemedi';
                } catch (parseError) {
                    // JSON değilse, ham yanıtı hata mesajı olarak kullan
                    console.error('İmza silme hatası (JSON olmayan yanıt):', responseText);
                    errorMessage = `İmza silinemedi (${response.status}: ${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''})`;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Başarılı yanıt
        console.log('İmza başarıyla silindi');
        
        // Yanıt boş olabilir, JSON olarak parse etmeyi dene
        if (responseText && responseText.trim()) {
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                console.warn('İmza silme başarılı, ancak JSON yanıt alınamadı:', parseError);
                // Boş bir obje döndürerek işlemin başarılı olduğunu bildir
                return { success: true };
            }
        } else {
            // Boş yanıt durumunda
            console.log('İmza silme başarılı, boş yanıt alındı');
            return { success: true };
        }
        
    } catch (error) {
        console.error('Buluttan silme hatası:', error);
        throw error;
    }
}