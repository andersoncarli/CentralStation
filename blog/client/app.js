import '../../src/client/utils.js';

const cs = new CentralStation();

let currentState = JSON.parse(localStorage.getItem('userState')) || { lang: 'en', theme: 'light' };

cs.on({
  'blogPosts': (data) => {
    const blogList = $('blog-list');
    if (blogList) {
      blogList.setAttribute('posts', JSON.stringify(data));
    }
  },
  'blogPost': (data) => {
    const blogPost = $('blog-post');
    if (blogPost) {
      blogPost.setAttribute('post', JSON.stringify(data));
    }
  },
  'newComment': (data) => {
    // Handle new comment (e.g., update UI or fetch updated post)
  },
  'loginSuccess': ({ token }) => {
    localStorage.setItem('authToken', token);
    window.location.href = '/dashboard';
  },
  'loginError': (message) => {
    alert(message);
  },
  'signupSuccess': ({ token }) => {
    localStorage.setItem('authToken', token);
    window.location.href = '/dashboard';
  },
  'signupError': (message) => {
    alert(message);
  },
  'stateUpdated': (state) => {
    currentState = state;
    applyState(state);
  }
});

function applyState(state) {
  if (state.lang !== currentState.lang) {
    window.location.reload();
  }
  if (state.theme !== currentState.theme) {
    setTheme(state.theme);
  }
}

// Fetch initial data if needed
if ($('blog-list')) {
  cs.emit('getBlogPosts');
}

const postId = new URLSearchParams(window.location.search).get('id');
if (postId && $('blog-post')) {
  cs.emit('getBlogPost', { id: postId });
}

// Handle login form submission
const loginForm = $('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('#username').value;
    const password = loginForm.querySelector('#password').value;
    cs.login(username, password);
  });
}

// Handle signup form submission
const signupForm = $('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = signupForm.querySelector('#username').value;
    const password = signupForm.querySelector('#password').value;
    cs.signup(username, password);
  });
}

// Language change handling
const langSelect = $('#language-select');
if (langSelect) {
  langSelect.value = currentState.lang;
  langSelect.addEventListener('change', (e) => {
    currentState.lang = e.target.value;
    cs.updateState(currentState);
  });
}

// Theme toggle
const themeToggle = $('#theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    currentState.theme = currentState.theme === 'light' ? 'dark' : 'light';
    cs.updateState(currentState);
  });
}

// Load flag images
$$('select option').forEach(option => {
  const lang = option.value;
  cs.emit('require', { path: `/flags/${lang}.svg` });
});

cs.on('flag', ({ path, data }) => {
  const lang = path.split('/').pop().split('.')[0];
  const option = $(`option[value="${lang}"]`);
  option.style.backgroundImage = `url(data:image/svg+xml;base64,${data})`;
  option.style.backgroundRepeat = 'no-repeat';
  option.style.backgroundPosition = 'left center';
  option.style.paddingLeft = '25px';
});

cs.start();