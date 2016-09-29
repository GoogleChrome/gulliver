/*
 * Generate gulliver.js from this file via `npm prestart`. (`npm start` will run
 * `prestart` automatically.)
 */

/* eslint-env browser */

/**
 * The `gapiReady` global resolves to window.gapi.
 */
window.gapiReady = window.gapiReady || new Promise(resolve => {
  // Adapted from GA embed code
  const c = 'gapiResolve';
  const s = document.createElement('script');
  const p = document.getElementsByTagName('script')[0];
  s.async = 1;
  s.src = `https://apis.google.com/js/api.js?onload=${c}`;
  p.parentNode.insertBefore(s, p);
  window[c] = () => resolve(window.gapi);
});

/**
 * Note: window.gapiReady must be a promise that resolves to
 * window.gapi.
 *
 * @template T
 * @param {string} name the library to load
 * @return {Promise<T>} resolves to window.gapi[name]
 */
function gapiLoad(name) {
  return new Promise((resolve, reject) => {
    if ('gapiReady' in window) {
      window.gapiReady.then(gapi => {
        gapi.load(name, () => resolve(gapi[name]));
      });
    } else {
      reject('Promise window.gapiReady not found');
    }
  });
}

/**
 * Promise'd version of [`gapi.client.load`](https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiclientloadname--------version--------callback).
 *
 * @template T
 * @param {string} name the API client to load
 * @param {string} [version="v1"] version
 * @return {Promise<T>} resolves to gapi.client[name]
 */
function clientLoad(name, version) { // eslint-disable-line no-unused-vars
  version = version ? version : 'v1';
  return gapiLoad('client').then(client => {
    return new Promise(resolve => {
      client.load(name, version, () => resolve(client[name]));
    });
  });
}

/**
 * Promise'd version of [`gapi.auth2.init`](https://developers.google.com/identity/sign-in/web/reference#gapiauth2initparams).
 *
 * @param {any} params https://developers.google.com/identity/sign-in/web/reference#gapiauth2initparams
 * @return {Promise<gapi.auth2.GoogleAuth>} Promise resolving to an initialized gapi.auth2.GoogleAuth object
 */
function authInit(params) {
  return gapiLoad('auth2').then(auth2 => {
    /* Ideally we'd just return `auth2.init(params)` here, but
     * instead we need to work around a few bugs and surprises in
     * `auth2.init()` and the "Promise" it returns.
     */
    return new Promise(resolve => {
      auth2.init(params).then(t => {
        t.then = null;
        resolve(t);
      });
    });
  });
}

/**
 * Translate generic "system" event like 'online', 'offline' and 'userchange'
 * into Gulliver-specific events. (e.g. as indicated by classes.)
 *
 * What this function does:
 *
 *   * all elements with class .gulliver-online-aware will:
 *     * have an 'online' dataset property that reflects the current online state.
 *     * receive a 'change' event whenever the state changes.
 *
 *   * all elements with class .gulliver-signedin-aware will:
 *     * have a 'signedin' dataset property that reflects the current signed in state.
 *     * receive a 'change' event whenever the state changes.
 *
 *   * the element #pwaForm also gets some special behaviour--see code. (This probably
 *     shouldn't happen here.)
 */
function setupEventHandlers() {
  window.addEventListener('online', () => {
    console.log('ONLINE');
    const onlineAware = document.querySelectorAll('.gulliver-online-aware');
    for (const e of onlineAware) {
      e.dataset.online = JSON.stringify(true);
      e.dispatchEvent(new CustomEvent('change'));
    }
  });

  window.addEventListener('offline', () => {
    console.log('OFFLINE');
    const onlineAware = document.querySelectorAll('.gulliver-online-aware');
    for (const e of onlineAware) {
      e.dataset.online = JSON.stringify(false);
      e.dispatchEvent(new CustomEvent('change'));
    }
  });

  window.addEventListener('userchange', e => {
    const user = e.detail;
    if (user.isSignedIn()) {
      console.log('id_token', user.getAuthResponse().id_token);
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', user.getAuthResponse().id_token);
      }
    } else {
      console.log('user signed out/never signed in');
      const pwaForm = document.getElementById('pwaForm');
      if (pwaForm) {
        const idTokenInput = document.getElementById('idToken');
        idTokenInput.setAttribute('value', '');
      }
    }
    const signedinAware = document.querySelectorAll('.gulliver-signedin-aware');
    for (const e of signedinAware) {
      e.dataset.signedin = JSON.stringify(user.isSignedIn());
      e.dispatchEvent(new CustomEvent('change'));
    }
  });
}

/**
 * Configures elements with class `gulliver-signed-aware` and
 * `gulliver-online-aware` to respond to 'change' events.
 */
function setupSignedinAware() {
  const list = document.querySelectorAll('.gulliver-signedin-aware.gulliver-online-aware');
  for (const e of list) {
    e.dataset.online = JSON.stringify(false);
    e.dataset.signedin = JSON.stringify(false);
    e.addEventListener('change', function() {
      const online = JSON.parse(this.dataset.online);
      const signedin = JSON.parse(this.dataset.signedin);
      switch (e.tagName.toLowerCase()) {
        case 'button':
          if (e.id === 'auth-button') {
            // auth-button state depends only on online state
            this.disabled = !online;
          } else {
            this.disabled = !online || !signedin;
          }
          break;
        case 'div':
          if (online && signedin) {
            this.style.opacity = 1;
            this.onclick = null;
          } else {
            this.style.opacity = 0.5;
            this.onclick = f => f.preventDefault();
          }
          break;
        default:
      }
    });
  }
}

/**
 * Configures elements with class `gulliver-online-aware` to respond to 'change'
 * events.
 */
function setupOnlineAware() {
  const l1 = document.querySelectorAll('div.button.gulliver-online-aware');
  for (const e of l1) {
    e.addEventListener('change', function() {
      if (JSON.parse(this.dataset.online)) {
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 1;
        this.onclick = null;
      } else {
        this.style.opacity = 0.5;
        this.onclick = f => f.preventDefault();
      }
    });
  }
  const l2 = document.querySelectorAll('div.pwabox.gulliver-online-aware');
  for (const e of l2) {
    e.addEventListener('change', function() {
      if (JSON.parse(this.dataset.online)) {
        // Online, make element active
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 1;
        this.onclick = null;
        return;
      }
      const href = e.querySelector('a') && e.querySelector('a').getAttribute('href');
      if (href) {
        fetch(href, {method: 'HEAD'}).then(r => {
          if (r.status === 200) {
            // Offline, but available in cache
            this.style.transition = 'opacity .5s ease-in-out';
            this.style.opacity = 1;
            this.onclick = null;
          } else {
            // Offline, but not cached
            this.style.transition = 'opacity .5s ease-in-out';
            this.style.opacity = 0.5;
            this.onclick = f => f.preventDefault();
          }
        });
      }
    });
  }
  const l3 = document.querySelectorAll('div.offline-status.gulliver-online-aware');
  for (const e of l3) {
    e.innerHTML = 'Offline';
    e.addEventListener('change', function() {
      this.style.opacity = 1;
      this.style.display = 'block';
      if (JSON.parse(this.dataset.online)) {
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 0;
      } else {
        this.style.transition = 'opacity .5s ease-in-out';
        this.style.opacity = 1;
      }
    });
  }
}

/**
 * Setup/configure Google signin itself. This translates GSI events into 'userchange'
 * events on the window object.
 */
function setupSignin() {
  /* eslint-disable camelcase */
  const params = {
    scope: 'profile',
    client_id: window.__config.client_id,
    fetch_basic_profile: false
  };
  /* eslint-enable camelcase */

  return authInit(params).then(auth => {
    // Fire 'userchange' event on page load (not just when status changes)
    window.dispatchEvent(new CustomEvent('userchange', {
      detail: auth.currentUser.get()
    }));

    // Fire 'userchange' event when status changes
    auth.currentUser.listen(user => {
      window.dispatchEvent(new CustomEvent('userchange', {
        detail: user
      }));
    });

    const authButton = document.getElementById('auth-button');
    const authButtonLabel = document.getElementById('auth-button-label');

    function updateAuthButtonLabel() {
      authButtonLabel.innerText = authButton.dataset.signedin === 'true' ?
        'Log out' :
        'Log in';
    }

    authButton.addEventListener('change', updateAuthButtonLabel);
    updateAuthButtonLabel();

    authButton.addEventListener(
      'click',
      () => {
        if (authButton.dataset.signedin === 'true') {
          auth.signOut();
        } else {
          auth.signIn();
        }
      }
    );

    return auth;
  });
}

/**
 * Register service worker.
 */
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(r => {
      console.log('REGISTRATION', r);
    });
  } else {
    console.log('SW not registered; navigator.serviceWorker is not available');
  }
}

function setupConfig() {
  const config = document.getElementById('config');
  if (config) {
    window.__config = JSON.parse(config.innerHTML);
  } else {
    console.log('CONFIG NOT FOUND');
  }
}

setupConfig();
setupOnlineAware();
setupSignedinAware();
setupSignin();
setupEventHandlers();
setupServiceWorker();

// Fire 'online' or 'offline' event on page load. (Without this, would only
// fire on change.)
window.dispatchEvent(new CustomEvent(navigator.onLine ? 'online' : 'offline'));

// GA embed code
/* eslint-disable */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', window.__config.ga_id, 'auto');
ga('send', 'pageview');
/* eslint-enable */
