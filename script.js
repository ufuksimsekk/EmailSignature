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
    try {
        const data = collectFormData();
        console.log('İmza oluşturuluyor, toplanan veriler:', data);
        
        const signaturePreview = document.getElementById('signaturePreview');
        const signatureCode = document.getElementById('signatureCode');
        
        // Logo boyut kontrollerinin görünürlüğünü ayarla
        const logoControls = document.querySelector('.logo-size-controls');
        if (logoControls) {
            logoControls.style.display = data.logoUrl ? 'block' : 'none';
        }
        
        let signatureHTML = '';
        
        // Font ailesini tırnak içine al ve sistem fontlarını kontrol et
        const systemFonts = ['Arial', 'Georgia', 'Courier New'];
        const fontFamily = data.font && systemFonts.includes(data.font) 
            ? data.font 
            : `'${data.font || 'Arial'}', sans-serif`;
        
        // Önizleme div'ine font ailesini doğrudan uygula
        if (signaturePreview) {
            signaturePreview.style.fontFamily = fontFamily;
            signaturePreview.style.fontSize = data.fontSize || '14px';
        }
        
        // Verileri doğrula ve eksik alanlar için varsayılan değerler kullan
        const verifiedData = {
            ...data,
            name: data.name || 'Ad Soyad',
            template: data.template || 'simple',
            fontSize: data.fontSize || '14px',
            primaryColor: data.primaryColor || '#3498db',
            secondaryColor: data.secondaryColor || '#2c3e50',
            linkedin: data.linkedin || { enabled: false, url: '' },
            twitter: data.twitter || { enabled: false, url: '' },
            facebook: data.facebook || { enabled: false, url: '' },
            instagram: data.instagram || { enabled: false, url: '' }
        };
        
        switch (verifiedData.template) {
            case 'professional':
                signatureHTML = generateProfessionalTemplate(verifiedData, fontFamily);
                break;
            case 'modern':
                signatureHTML = generateModernTemplate(verifiedData, fontFamily);
                break;
            case 'minimal':
                signatureHTML = generateMinimalTemplate(verifiedData, fontFamily);
                break;
            case 'simple':
            default:
                signatureHTML = generateSimpleTemplate(verifiedData, fontFamily);
        }
        
        if (signaturePreview) {
            signaturePreview.innerHTML = signatureHTML;
        }
        
        // Eğer signatureCode elementi varsa güncelle
        if (signatureCode) {
            signatureCode.textContent = signatureHTML;
        }
        
        return signatureHTML;
    } catch (error) {
        console.error('İmza oluşturma hatası:', error);
        alert('İmza oluşturulurken bir hata oluştu: ' + error.message);
        return '';
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

// Form verilerini topla
function collectFormData() {
    const logoUrl = document.getElementById('logoUrl').value;
    const logoSize = parseInt(document.getElementById('logoSize').value) || 80;
    const maintainRatio = document.getElementById('logoMaintainRatio').checked;

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
        logoUrl: logoUrl,
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
                                <button class="load-signature" data-id="${signature.id}" data-type="cloud">Editörde Aç</button>
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
                                <button class="load-signature" data-index="${index}" data-type="local">Editörde Aç</button>
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

// İmza yükleme fonksiyonu (Yerel)
function loadSignatureFromLocal(index) {
    const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    if (index >= 0 && index < savedSignatures.length) {
        const signature = savedSignatures[index];
        loadSignatureToForm(signature);
    }
}

// Tüm bulut imzalarını yükleme fonksiyonu
async function loadSignaturesFromCloud() {
    try {
        if (!currentUser || !currentUser.token) {
            throw new Error('Kullanıcı giriş yapmamış');
        }
        
        const response = await fetch(`${API_URL}/users/signatures`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`İmzalar yüklenemedi (${response.status})`);
        }
        
        const signatures = await response.json();
        
        // Eğer API bir dizi döndürüyorsa, doğrudan kullan
        if (Array.isArray(signatures)) {
            return signatures;
        }
        
        // Eğer API bir nesne döndürüyorsa, içindeki dizi alanlarını kontrol et
        if (typeof signatures === 'object') {
            if (signatures.signatures && Array.isArray(signatures.signatures)) {
                return signatures.signatures;
            } else if (signatures.items && Array.isArray(signatures.items)) {
                return signatures.items;
            } else if (signatures.data && Array.isArray(signatures.data)) {
                return signatures.data;
            }
        }
        
        // En kötü durumda boş dizi döndür
        return [];
    } catch (error) {
        console.error('Buluttan imzalar yüklenemedi:', error);
        throw error;
    }
}

// İmza yükleme fonksiyonu (Bulut)
async function loadSignatureFromCloud(id) {
    try {
        if (!currentUser || !currentUser.token) {
            alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
            return;
        }
        
        const response = await fetch(`${API_URL}/users/signatures/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`İmza yüklenemedi (${response.status})`);
        }
        
        const signature = await response.json();
        console.log('API\'den gelen imza verisi:', signature);
        
        // API'den gelen veriyi doğrudan kullan, formatlama yapmadan
        loadSignatureToForm(signature);
    } catch (error) {
        console.error('Buluttan imza yükleme hatası:', error);
        alert('İmza yüklenemedi: ' + error.message);
    }
}

// Form verilerini doldur
async function loadSignatureToForm(signature) {
    try {
        // Veriyi standardize et ve doğrula
        const standardizedSignature = standardizeSignatureData(signature);
        console.log('Form için standardize edilmiş imza verisi:', standardizedSignature);

        // Form alanlarını doldur
        const formFields = {
            name: standardizedSignature.name || '',
            title: standardizedSignature.title || '',
            company: standardizedSignature.company || '',
            email: standardizedSignature.email || '',
            phone: standardizedSignature.phone || '',
            website: standardizedSignature.website || '',
            address: standardizedSignature.address || '',
            font: standardizedSignature.font || 'Arial',
            fontSize: standardizedSignature.fontSize || '12',
            primaryColor: standardizedSignature.primaryColor || '#000000',
            secondaryColor: standardizedSignature.secondaryColor || '#666666',
            logoUrl: standardizedSignature.logoUrl || '',
            avatarUrl: standardizedSignature.avatarUrl || '',
            disclaimer: standardizedSignature.disclaimer || '',
            template: standardizedSignature.template || 'template1',
            linkedin: standardizedSignature.socialMedia?.linkedin || '',
            twitter: standardizedSignature.socialMedia?.twitter || '',
            facebook: standardizedSignature.socialMedia?.facebook || '',
            instagram: standardizedSignature.socialMedia?.instagram || '',
            youtube: standardizedSignature.socialMedia?.youtube || '',
            github: standardizedSignature.socialMedia?.github || ''
        };

        // Her form alanını güvenli bir şekilde doldur
        for (const [fieldId, value] of Object.entries(formFields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else {
                    element.value = value;
                }
            } else {
                console.warn(`${fieldId} elementi bulunamadı`);
            }
        }

        // Logo boyutlarını güncelle
        logoSize = standardizedSignature.logoSize || 80;
        maintainRatio = standardizedSignature.maintainRatio !== undefined ? standardizedSignature.maintainRatio : true;

        // Logo kontrol panelini güncelle
        const logoControlPanel = document.getElementById('logoControlPanel');
        if (logoControlPanel) {
            logoControlPanel.style.display = standardizedSignature.logoUrl ? 'block' : 'none';
            
            // Logo boyut slider'ını güncelle
            const logoSizeSlider = document.getElementById('logoSize');
            if (logoSizeSlider) {
                logoSizeSlider.value = logoSize;
            }
            
            // Logo boyut değerini güncelle
            const logoSizeValue = document.getElementById('logoSizeValue');
            if (logoSizeValue) {
                logoSizeValue.textContent = `${logoSize}px`;
            }
            
            // Oran koruma checkbox'ını güncelle
            const maintainRatioCheckbox = document.getElementById('logoMaintainRatio');
            if (maintainRatioCheckbox) {
                maintainRatioCheckbox.checked = maintainRatio;
            }
        }

        // Sosyal medya checkbox'larını güncelle
        const socialMediaFields = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'github'];
        socialMediaFields.forEach(social => {
            const checkbox = document.getElementById(social);
            const urlInput = document.getElementById(`${social}Url`);
            
            if (checkbox && urlInput) {
                const hasUrl = Boolean(standardizedSignature.socialMedia?.[social]);
                checkbox.checked = hasUrl;
                urlInput.style.display = hasUrl ? 'block' : 'none';
            }
        });

        // İmzayı oluştur
        generateSignature();

        // Başarılı yükleme bildirimi
        showNotification('İmza başarıyla yüklendi', 'success');
    } catch (error) {
        console.error('Form yükleme hatası:', error);
        showNotification(error.message || 'Form yüklenirken bir hata oluştu', 'error');
        throw error; // Hata yönetimini üst katmana bırak
    }
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
async function uploadLocalSignatureToCloud() {
    try {
        // Form verilerini topla
        const signature = {
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            company: document.getElementById('company').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            website: document.getElementById('website').value,
            address: document.getElementById('address').value,
            font: document.getElementById('font').value,
            fontSize: parseInt(document.getElementById('fontSize').value),
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            logoUrl: document.getElementById('logoUrl').value,
            avatarUrl: document.getElementById('avatarUrl').value,
            disclaimer: document.getElementById('disclaimer').value,
            template: document.getElementById('template').value,
            logoSize: logoSize,
            maintainRatio: maintainRatio,
            socialMedia: {
                linkedin: document.getElementById('linkedin').value,
                twitter: document.getElementById('twitter').value,
                facebook: document.getElementById('facebook').value,
                instagram: document.getElementById('instagram').value,
                youtube: document.getElementById('youtube').value,
                github: document.getElementById('github').value
            }
        };

        // Veriyi standardize et ve doğrula
        const standardizedSignature = standardizeSignatureData(signature);
        console.log('Standardize edilmiş imza verisi:', standardizedSignature);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Kullanıcı girişi yapılmamış');
        }

        const response = await fetch(`${API_URL}/signatures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(standardizedSignature)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'İmza yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        console.log('Bulut yanıtı:', data);
        
        showNotification('İmza başarıyla buluta yüklendi', 'success');
        await loadSignaturesFromCloud(); // İmza listesini güncelle
    } catch (error) {
        console.error('İmza yükleme hatası:', error);
        showNotification(error.message || 'İmza yüklenirken bir hata oluştu', 'error');
    }
}

async function loadSignatureFromCloud(signatureId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Kullanıcı girişi yapılmamış');
        }

        const response = await fetch(`${API_URL}/signatures/${signatureId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'İmza yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        console.log('Buluttan alınan imza verisi:', data);
        
        // Veriyi standardize et ve doğrula
        const standardizedSignature = standardizeSignatureData(data);
        console.log('Standardize edilmiş imza verisi:', standardizedSignature);
        
        // İmza verilerini form alanlarına yükle
        await loadSignatureToForm(standardizedSignature);
        
        showNotification('İmza başarıyla yüklendi', 'success');
    } catch (error) {
        console.error('İmza yükleme hatası:', error);
        showNotification(error.message || 'İmza yüklenirken bir hata oluştu', 'error');
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

// İmza veri şeması ve doğrulama fonksiyonları
const signatureSchema = {
    name: { type: 'string', required: true },
    title: { type: 'string', required: false },
    company: { type: 'string', required: false },
    email: { type: 'string', required: true, format: 'email' },
    phone: { type: 'string', required: false },
    website: { type: 'string', required: false },
    address: { type: 'string', required: false },
    font: { type: 'string', required: true, default: 'Arial' },
    fontSize: { type: 'number', required: true, default: 12 },
    primaryColor: { type: 'string', required: true, default: '#000000' },
    secondaryColor: { type: 'string', required: true, default: '#666666' },
    logoUrl: { type: 'string', required: false },
    avatarUrl: { type: 'string', required: false },
    disclaimer: { type: 'string', required: false },
    template: { type: 'string', required: true, default: 'template1' },
    logoSize: { type: 'number', required: true, default: 80 },
    maintainRatio: { type: 'boolean', required: true, default: true },
    socialMedia: {
        type: 'object',
        required: false,
        properties: {
            linkedin: { type: 'string', required: false },
            twitter: { type: 'string', required: false },
            facebook: { type: 'string', required: false },
            instagram: { type: 'string', required: false },
            youtube: { type: 'string', required: false },
            github: { type: 'string', required: false }
        }
    }
};

// Veri doğrulama fonksiyonu
function validateSignatureData(data) {
    const errors = [];
    const validatedData = {};

    // Zorunlu alanları kontrol et
    for (const [key, schema] of Object.entries(signatureSchema)) {
        if (schema.required && !data[key]) {
            if (schema.default !== undefined) {
                validatedData[key] = schema.default;
            } else {
                errors.push(`${key} alanı zorunludur`);
            }
        } else if (data[key] !== undefined) {
            // Tip kontrolü
            if (schema.type === 'number' && isNaN(Number(data[key]))) {
                errors.push(`${key} alanı sayı olmalıdır`);
            } else if (schema.type === 'boolean' && typeof data[key] !== 'boolean') {
                errors.push(`${key} alanı boolean olmalıdır`);
            } else {
                validatedData[key] = data[key];
            }
        }
    }

    // E-posta formatı kontrolü
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Geçersiz e-posta formatı');
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: validatedData
    };
}

// İmza verilerini standardize etme fonksiyonu
function standardizeSignatureData(data) {
    try {
        // Temel veri yapısını oluştur
        const standardizedData = {
            name: String(data.name || ''),
            title: String(data.title || ''),
            company: String(data.company || ''),
            email: String(data.email || ''),
            phone: String(data.phone || ''),
            website: String(data.website || ''),
            address: String(data.address || ''),
            font: String(data.font || 'Arial'),
            fontSize: data.fontSize ? String(data.fontSize).replace('px', '') : '12',
            primaryColor: String(data.primaryColor || '#000000'),
            secondaryColor: String(data.secondaryColor || '#666666'),
            logoUrl: String(data.logoUrl || ''),
            avatarUrl: String(data.avatarUrl || ''),
            disclaimer: String(data.disclaimer || ''),
            template: String(data.template || 'template1'),
            logoSize: Number(data.logoSize || 80),
            maintainRatio: data.maintainRatio !== undefined ? Boolean(data.maintainRatio) : true,
            socialMedia: {
                linkedin: String(data.socialMedia?.linkedin || ''),
                twitter: String(data.socialMedia?.twitter || ''),
                facebook: String(data.socialMedia?.facebook || ''),
                instagram: String(data.socialMedia?.instagram || ''),
                youtube: String(data.socialMedia?.youtube || ''),
                github: String(data.socialMedia?.github || '')
            },
            lastModified: new Date().toISOString()
        };

        // Logo URL'sini doğrula ve düzelt
        if (standardizedData.logoUrl) {
            // Base64 veya data URL kontrolü
            if (standardizedData.logoUrl.startsWith('data:')) {
                // Base64 veya data URL ise olduğu gibi bırak
                console.log('Logo URL bir data URL olarak kabul edildi');
            } else {
                // Normal URL ise protokol ekle ve doğrula
                if (!standardizedData.logoUrl.startsWith('http://') && !standardizedData.logoUrl.startsWith('https://')) {
                    standardizedData.logoUrl = 'https://' + standardizedData.logoUrl;
                }
                
                // URL formatını doğrula
                try {
                    new URL(standardizedData.logoUrl);
                } catch (e) {
                    throw new Error('Geçersiz logo URL formatı');
                }
            }
        }

        // Logo boyutlarını doğrula
        if (standardizedData.logoSize < 10 || standardizedData.logoSize > 500) {
            standardizedData.logoSize = 80; // Varsayılan değer
        }

        return standardizedData;
    } catch (error) {
        console.error('Veri standardizasyon hatası:', error);
        throw new Error('Veri doğrulama hatası: ' + error.message);
    }
}