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
        const htmlContent = signaturePreview.innerHTML;
        
        // HTML içeriğini kopyala
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        // Tüm içeriği seç
        const range = document.createRange();
        range.selectNode(tempDiv);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        // Kopyala
        document.execCommand('copy');
        
        // Geçici div'i kaldır
        document.body.removeChild(tempDiv);
        window.getSelection().removeAllRanges();
        
        alert('İmza panoya kopyalandı! Artık e-posta istemcinize yapıştırabilirsiniz.');
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

    // Sayfa yüklendiğinde oturum kontrolü
    await checkSession();
});

// İmza oluşturma işlevi
function generateSignature() {
    const data = collectFormData();
    const signaturePreview = document.getElementById('signaturePreview');
    const signatureCode = document.getElementById('signatureCode');
    
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
        case 'min_minimal':
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
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize};">`;
    
    // Logo varsa ekle
    if (data.logoUrl) {
        const logoStyle = data.maintainRatio 
            ? `max-width: ${data.logoSize}px; height: auto;` 
            : `width: ${data.logoSize}px; height: ${data.logoSize}px;`;
        html += `<div style="margin-bottom: 10px;"><img src="${data.logoUrl}" alt="${data.company} Logo" style="${logoStyle}"></div>`;
    }
    
    // Ad Soyad ve Pozisyon
    html += `<div style="color: ${data.primaryColor}; font-weight: bold;">${data.name || 'Ad Soyad'}</div>`;
    
    // Pozisyon ve şirket
    if (data.title || data.company) {
        html += `<div>${data.title || ''}${data.title && data.company ? ' | ' : ''}${data.company || ''}</div>`;
    }
    
    // İletişim bilgileri
    if (data.email || data.phone) {
        html += `<div>${data.email || ''}${data.email && data.phone ? ' | ' : ''}${data.phone || ''}</div>`;
    }
    
    // Website ve adres
    if (data.website || data.address) {
        html += `<div>${data.website || ''}${data.website && data.address ? ' | ' : ''}${data.address || ''}</div>`;
    }
    
    // Sosyal medya ikonları
    let hasSocialMedia = false;
    let socialHTML = '<div style="margin-top: 10px;">';
    
    if (data.linkedin.enabled && data.linkedin.url) {
        socialHTML += `<a href="${data.linkedin.url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style="height: 20px; width: 20px;"></a>`;
        hasSocialMedia = true;
    }
    
    if (data.twitter.enabled && data.twitter.url) {
        socialHTML += `<a href="${data.twitter.url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="height: 20px; width: 20px;"></a>`;
        hasSocialMedia = true;
    }
    
    if (data.facebook.enabled && data.facebook.url) {
        socialHTML += `<a href="${data.facebook.url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="height: 20px; width: 20px;"></a>`;
        hasSocialMedia = true;
    }
    
    if (data.instagram.enabled && data.instagram.url) {
        socialHTML += `<a href="${data.instagram.url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="height: 20px; width: 20px;"></a>`;
        hasSocialMedia = true;
    }
    
    socialHTML += '</div>';
    
    if (hasSocialMedia) {
        html += socialHTML;
    }
    
    // Yasal uyarı
    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }
    
    html += '</div>';
    return html;
}

// Profesyonel şablon oluşturma
function generateProfessionalTemplate(data, fontFamily) {
    let html = `<table style="font-family: ${fontFamily}; font-size: ${data.fontSize}; border-collapse: collapse; width: 100%;">`;
    html += '<tr>';
    
    // Logo sütunu
    html += '<td style="vertical-align: middle; width: ' + (data.logoSize + 30) + 'px; padding-right: 20px; border-right: 3px solid ' + data.secondaryColor + ';">';
    if (data.logoUrl) {
        const logoStyle = data.maintainRatio 
            ? `max-width: ${data.logoSize}px; height: auto; display: block; margin: 0 auto;` 
            : `width: ${data.logoSize}px; height: ${data.logoSize}px; display: block; margin: 0 auto;`;
        html += `<img src="${data.logoUrl}" alt="${data.company} Logo" style="${logoStyle}">`;
    }
    html += '</td>';
    
    // Bilgi sütunu
    html += '<td style="vertical-align: middle; padding-left: 20px;">';
    html += `<div style="color: ${data.primaryColor}; font-weight: bold;">${data.name}</div>`;
    html += `<div style="color: #777;">${data.title} | ${data.company}</div>`;
    html += `<div>${data.email} | ${data.phone}</div>`;
    html += `<div>${data.website}</div>`;
    html += `<div>${data.address}</div>`;
    html += '</td>';
    
    html += '</tr></table>';

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

    return html;
}

function generateModernTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize}; padding-left: 10px; border-left: 4px solid ${data.primaryColor};">`;
    html += `<div style="font-weight: bold; font-size: 16px;">${data.name}</div>`;
    html += `<div style="color: #777;">${data.title} | ${data.company}</div>`;
    html += `<div>${data.email} | ${data.phone}</div>`;
    html += `<div>${data.website}</div>`;
    html += `<div>${data.address}</div>`;
    html += '</div>';

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

    return html;
}

function generateMinimalTemplate(data, fontFamily) {
    let html = `<div style="font-family: ${fontFamily}; font-size: ${data.fontSize};">`;
    html += `<div style="font-weight: bold;">${data.name}</div>`;
    html += `<div style="color: #777;">${data.title}, ${data.company}</div>`;
    html += `<div>${data.email}</div>`;
    html += '</div>';

    if (data.disclaimer) {
        html += `<div style="margin-top: 10px; font-size: 10px; color: ${data.secondaryColor};">${data.disclaimer}</div>`;
    }

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
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kayıt işlemi başarısız');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Kayıt hatası:', error);
        throw error;
    }
}

// Kullanıcı işlemleri için fonksiyonlar
async function handleRegister() {
    const email = authEmail.value;
    const password = authPassword.value;
    const name = authName.value;
    
    if (!email || !password || !name) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }
    
    try {
        const response = await registerUser(email, password, name);
        if (response.message === 'Doğrulama maili gönderildi') {
            // Doğrulama formunu göster
            authNameGroup.style.display = 'none';
            verificationCodeGroup.style.display = 'block';
            authSubmitBtn.textContent = 'Doğrula';
            authSubmitBtn.onclick = async () => {
                const code = document.getElementById('verificationCode').value;
                if (!code) {
                    alert('Lütfen doğrulama kodunu girin!');
                    return;
                }
                try {
                    const data = await verifyEmail(email, code);
                    currentUser = data.user;
                    localStorage.setItem('userToken', data.token);
                    updateUI();
                    hideAuthModal();
                    alert('Hesabınız başarıyla doğrulandı!');
                } catch (error) {
                    alert('Doğrulama başarısız: ' + error.message);
                }
            };
        }
    } catch (error) {
        alert('Kayıt işlemi başarısız: ' + error.message);
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

// Doğrulama kodu kontrolü
async function verifyEmail(email, code) {
    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Doğrulama başarısız');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        throw error;
    }
}