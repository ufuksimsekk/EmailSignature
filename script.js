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
        
        // Local storage'a kaydet
        let savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        savedSignatures.push(signatureData);
        localStorage.setItem('emailSignatures', JSON.stringify(savedSignatures));
        
        // Kaydedilen imzalar listesini güncelle
        updateSavedSignaturesList();
        
        alert(`"${signatureName}" imzası başarıyla kaydedildi!`);
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
        
        // Outlook için özel div oluştur
        const outlookDiv = document.createElement('div');
        outlookDiv.setAttribute('contenteditable', 'true');
        outlookDiv.innerHTML = htmlContent;
        outlookDiv.style.position = 'fixed';
        outlookDiv.style.left = '-9999px';
        document.body.appendChild(outlookDiv);
        
        // İçeriği seç
        const range = document.createRange();
        range.selectNodeContents(outlookDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Kopyala
        const successful = document.execCommand('copy');
        
        // Geçici div'i kaldır
        document.body.removeChild(outlookDiv);
        
        // Bildiri göster
        if (successful) {
            alert('İmza Outlook için kopyalandı! Outlook\'ta imza ayarlarına yapıştırabilirsiniz.');
        } else {
            alert('Kopyalama başarısız oldu. Lütfen tekrar deneyin.');
        }
    });

    // Sayfa yüklendiğinde oturum kontrolü
    await checkSession();
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
function updateSavedSignaturesList() {
    const savedSignaturesList = document.getElementById('savedSignaturesList');
    const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    
    if (savedSignatures.length === 0) {
        savedSignaturesList.innerHTML = '<p>Henüz kaydedilmiş imza bulunmuyor.</p>';
        return;
    }
    
    let html = '<div class="saved-signatures-grid">';
    savedSignatures.forEach((signature, index) => {
        html += `
            <div class="saved-signature" data-index="${index}">
                <div class="signature-preview">${signature.html}</div>
                <div class="signature-actions">
                    <button class="load-signature" data-index="${index}">Yükle</button>
                    <button class="delete-signature" data-index="${index}">Sil</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    savedSignaturesList.innerHTML = html;
    
    // Yükle ve sil butonları için event listener'ları ekle
    document.querySelectorAll('.load-signature').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            loadSignature(index);
        });
    });
    
    document.querySelectorAll('.delete-signature').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteSignature(index);
        });
    });
}

// İmza yükleme fonksiyonu
function loadSignature(index) {
    const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    if (index >= 0 && index < savedSignatures.length) {
        const signature = savedSignatures[index];
        
        // Form alanlarını doldur
        document.getElementById('name').value = signature.name || '';
        document.getElementById('title').value = signature.title || '';
        document.getElementById('company').value = signature.company || '';
        document.getElementById('email').value = signature.email || '';
        document.getElementById('phone').value = signature.phone || '';
        document.getElementById('website').value = signature.website || '';
        document.getElementById('address').value = signature.address || '';
        document.getElementById('template').value = signature.template || 'simple';
        document.getElementById('font').value = signature.font || 'Arial';
        document.getElementById('fontSize').value = signature.fontSize || '14px';
        document.getElementById('primaryColor').value = signature.primaryColor || '#3498db';
        document.getElementById('secondaryColor').value = signature.secondaryColor || '#2c3e50';
        document.getElementById('logoUrl').value = signature.logoUrl || '';
        document.getElementById('avatarUrl').value = signature.avatarUrl || '';
        document.getElementById('disclaimer').value = signature.disclaimer || '';
        
        // Sosyal medya ayarlarını güncelle
        document.getElementById('linkedin').checked = signature.linkedin?.enabled || false;
        document.getElementById('twitter').checked = signature.twitter?.enabled || false;
        document.getElementById('facebook').checked = signature.facebook?.enabled || false;
        document.getElementById('instagram').checked = signature.instagram?.enabled || false;
        
        document.getElementById('linkedinUrl').value = signature.linkedin?.url || '';
        document.getElementById('twitterUrl').value = signature.twitter?.url || '';
        document.getElementById('facebookUrl').value = signature.facebook?.url || '';
        document.getElementById('instagramUrl').value = signature.instagram?.url || '';
        
        // Sosyal medya input alanlarını göster/gizle
        updateSocialLinksVisibility();
        
        // İmzayı oluştur
        generateSignature();
        
        // Editör sekmesine geç
        switchTab('editor');
    }
}

// İmza silme fonksiyonu
function deleteSignature(index) {
    if (confirm('Bu imzayı silmek istediğinizden emin misiniz?')) {
        const savedSignatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
        savedSignatures.splice(index, 1);
        localStorage.setItem('emailSignatures', JSON.stringify(savedSignatures));
        updateSavedSignaturesList();
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
    } catch (error) {
        alert('Giriş başarısız: ' + error.message);
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('userToken');
    updateUI();
    alert('Çıkış yapıldı!');
}

// Sayfa yüklendiğinde oturum kontrolü
async function checkSession() {
    const token = localStorage.getItem('userToken');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                currentUser.token = token;
            } else {
                localStorage.removeItem('userToken');
            }
        } catch (error) {
            console.error('Oturum kontrolü hatası:', error);
            localStorage.removeItem('userToken');
        }
    }
    updateUI();
}

function updateUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
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
        updateUI();
    } catch (error) {
        console.error('Oturum kontrolü hatası:', error);
        localStorage.removeItem('userToken');
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
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Doğrulama işlemi sırasında bir hata oluştu');
        }
        
        // Kullanıcı bilgilerini ve token'ı kaydet
        currentUser = data.user;
        localStorage.setItem('userToken', data.token);
        
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