(function () {
  const GA_ID = 'G-LEKXT80FP0';
function injectCookieStyles() {
  if (document.getElementById('cookie-banner-styles')) return;

  const style = document.createElement('style');
  style.id = 'cookie-banner-styles';

  style.textContent = `
    #cookie-banner{
      position:fixed;
      left:0;
      right:0;
      bottom:0;
      z-index:9999;
      background:#0f172a;
      color:white;
      box-shadow:0 -8px 30px rgba(15,23,42,.18);
      font-family:Arial,sans-serif;
    }

    .cookie-banner-inner{
      max-width:1180px;
      margin:auto;
      padding:20px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:24px;
    }

    .cookie-text{
      max-width:760px;
    }

    .cookie-text strong{
      font-size:18px;
      color:white;
    }

    .cookie-text p{
      margin:8px 0 0;
      color:#cbd5e1;
      line-height:1.6;
    }

    .cookie-text a{
      color:white;
      text-decoration:underline;
    }

    .cookie-actions{
      display:flex;
      gap:12px;
      flex-wrap:wrap;
    }

    .cookie-btn{
      padding:12px 20px;
      border-radius:10px;
      font-weight:800;
      cursor:pointer;
      font-size:15px;
      font-family:Arial,sans-serif;
    }

    .cookie-btn-primary{
      background:white;
      color:#0f172a;
      border:1px solid white;
    }

    .cookie-btn-secondary{
      background:transparent;
      color:white;
      border:1px solid #94a3b8;
    }

    @media(max-width:700px){
      .cookie-banner-inner{
        flex-direction:column;
        align-items:flex-start;
      }

      .cookie-actions{
        width:100%;
      }

      .cookie-btn{
        flex:1;
      }
    }
  `;

  document.head.appendChild(style);
}
  function loadGoogleAnalytics() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function saveConsent(value) {
    localStorage.setItem('capitalenmarcha_cookie_consent', value);
  }

  function getConsent() {
    return localStorage.getItem('capitalenmarcha_cookie_consent');
  }

  function removeBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.remove();
  }

  function createBanner() {
    injectCookieStyles();
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';

    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-text">
          <strong>Cookies y privacidad</strong>
          <p>
            Utilizamos cookies de analítica para entender cómo se usa Capital en Marcha
            y mejorar la web. Puedes aceptar o rechazar estas cookies.
          </p>
        </div>

        <div class="cookie-actions">
          <button id="cookie-reject" class="cookie-btn cookie-btn-secondary">
            Rechazar
          </button>

          <button id="cookie-accept" class="cookie-btn cookie-btn-primary">
            Aceptar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document
      .getElementById('cookie-accept')
      .addEventListener('click', function () {
        saveConsent('accepted');
        loadGoogleAnalytics();
        removeBanner();
      });

    document
      .getElementById('cookie-reject')
      .addEventListener('click', function () {
        saveConsent('rejected');
        removeBanner();
      });
  }

  function initCookies() {
    const consent = getConsent();

    if (consent === 'accepted') {
      loadGoogleAnalytics();
      return;
    }

    if (consent === 'rejected') {
      return;
    }

    createBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookies);
  } else {
    initCookies();
  }
})();