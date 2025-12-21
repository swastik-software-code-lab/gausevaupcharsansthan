/* script.js — updated for:
   - visible UPI copy button behavior & message
   - emergency: removed whatsapp button (emergency section)
   - call button includes icon (HTML changed)
   - contact form send button smaller; spinner & disable behavior
   - requestPickup prefill & scroll
   IMPORTANT: Replace CONFIG values with real values (UPI, PHONE, EmailJS, GAS)
*/

const CONFIG = {
    UPI_ID: 'gausevaupcharsansthan@upi', //change
    PHONE: '+911234567890', //change
    DOMAIN: 'https://www.gausevaupcharsansthan.in',
    EMAILJS_USER_ID: 'YOUR_EMAILJS_USERID',  //change
    EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICEID', //change
    EMAILJS_TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATEID', //change
    GAS_ENDPOINT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec' //change
};

document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Hamburger toggle ---------- */
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');

    hamburger.addEventListener('click', function () {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        if (nav.style.display === 'block') {
            nav.style.display = '';
        } else {
            nav.style.display = 'block';
        }
    });

    // Close nav on link click (mobile)
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            if (window.innerWidth < 860) {
                nav.style.display = '';
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* ---------- Smooth internal scroll ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ---------- Gallery auto-load ---------- */
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryImages = [
        'assests/img/GSUS gallery 1.jpeg',
        'assests/img/GSUS gallery 2.jpeg',
        'assests/img/GSUS gallery 3.jpeg',
        'assests/img/GSUS gallery 4.jpeg',
        'assests/img/GSUS gallery 5.jpeg'
    ];
    galleryImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'गौ सेवा कार्य की तस्वीर';
        img.loading = 'lazy';
        galleryGrid.appendChild(img);
    });

    /* ---------- UPI QR generation & copy ---------- */
    const upiIdEl = document.getElementById('upiId');
    const upiQrImg = document.getElementById('upiQR');
    const copyUpiBtn = document.getElementById('copyUpi');
    const openUpiBtn = document.getElementById('openUpi');

    if (upiIdEl) upiIdEl.textContent = CONFIG.UPI_ID;

    if (upiQrImg && CONFIG.UPI_ID) {
        const upiUri = `upi://pay?pa=${encodeURIComponent(CONFIG.UPI_ID)}&pn=${encodeURIComponent('Gau Seva Upchar Sansthan')}&cu=INR`;
        const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiUri)}`;
        upiQrImg.src = qrUrl;
        upiQrImg.alt = `UPI QR (${CONFIG.UPI_ID})`;
        if (openUpiBtn) openUpiBtn.href = upiUri;
    }

    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(CONFIG.UPI_ID).then(() => {
                // show clear Hindi success message
                copyUpiBtn.textContent = 'कॉपी हो गया';
                // temporarily change style
                copyUpiBtn.disabled = true;
                setTimeout(() => {
                    copyUpiBtn.textContent = 'UPI ID कॉपी करें';
                    copyUpiBtn.disabled = false;
                }, 2500);
            }).catch(() => {
                alert('कृपया मैन्युअली कॉपी करें: ' + CONFIG.UPI_ID);
            });
        });
    }

    /* ---------- Contact form handling ---------- */
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const sendBtn = document.getElementById('sendBtn');

    // Initialize EmailJS if configured
    if (typeof emailjs !== 'undefined' && CONFIG.EMAILJS_USER_ID && CONFIG.EMAILJS_USER_ID !== 'YOUR_EMAILJS_USERID') {
        try { emailjs.init(CONFIG.EMAILJS_USER_ID); } catch (e) { console.warn('EmailJS init error', e); }
    }

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const data = {
            name: document.getElementById('c-name').value.trim(),
            phone: document.getElementById('c-phone').value.trim(),
            email: document.getElementById('c-email').value.trim(),
            message: document.getElementById('c-message').value.trim()
        };

        if (!data.name || !data.phone || !data.email || !data.message) {
            formStatus.textContent = 'कृपया सभी फ़ील्ड भरें।';
            return;
        }

        // UI loading on send button
        sendBtn.classList.add('loading');
        sendBtn.disabled = true;

        function sendEmailJS() {
            return new Promise((resolve, reject) => {
                if (typeof emailjs === 'undefined' || CONFIG.EMAILJS_USER_ID === 'YOUR_EMAILJS_USERID') {
                    resolve({ status: 'skipped' });
                    return;
                }
                emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
                    from_name: data.name,
                    from_email: data.email,
                    phone: data.phone,
                    message: data.message
                }).then(res => resolve({ status: 'ok', res }), err => reject(err));
            });
        }

        function postToGAS() {
            return new Promise((resolve, reject) => {
                if (!CONFIG.GAS_ENDPOINT_URL || CONFIG.GAS_ENDPOINT_URL.includes('YOUR_SCRIPT_ID')) {
                    resolve({ status: 'skipped' });
                    return;
                }
                fetch(CONFIG.GAS_ENDPOINT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(r => r.json()).then(json => resolve({ status: 'ok', json })).catch(err => reject(err));
            });
        }

        Promise.allSettled([sendEmailJS(), postToGAS()]).then(results => {
            const parts = [];
            if (results[0].status === 'fulfilled') {
                parts.push(results[0].value.status === 'skipped' ? 'ईमेल: (कन्फ़िग नहीं)' : 'ईमेल: सफल');
            } else {
                parts.push('ईमेल: त्रुटि');
                console.error('EmailJS error', results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
                parts.push(results[1].value.status === 'skipped' ? 'Sheet: (कन्फ़िग नहीं)' : 'Sheet: सफल');
            } else {
                parts.push('Sheet: त्रुटि');
                console.error('GAS error', results[1].reason);
            }

            formStatus.textContent = parts.join(' • ');
            contactForm.reset();
        }).catch(err => {
            console.error(err);
            formStatus.textContent = 'प्रेषण में त्रुटि हुई। कृपया बाद में प्रयास करें।';
        }).finally(() => {
            sendBtn.classList.remove('loading');
            sendBtn.disabled = false;
        });
    });

    /* ---------- Floating call button uses CONFIG phone ---------- */
    const floatCall = document.querySelector('.float-btn.call');
    if (floatCall) floatCall.href = `tel:${CONFIG.PHONE}`;

});
