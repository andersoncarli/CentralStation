import { CentralStation, processCss, setTheme, t } from './centralStation.js';
import { Header, BlogList, BlogPost, LoginForm, SignupForm } from '../components/BlogComponents.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodeFlags from 'node-flags';

const cs = new CentralStation({ port: 3000 });

// Mock user database (replace with actual database in production)
const users = [];

// JWT secret (use a secure, environment-specific secret in production)
const JWT_SECRET = 'your-secret-key';

// Middleware to check if the user is authenticated
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
};

// Public routes
cs.route('/', async (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const posts = await fetchPublicBlogPosts();
  const content = `
    <blog-header lang="${lang}"></blog-header>
    <blog-list posts='${JSON.stringify(posts)}' lang="${lang}"></blog-list>
  `;
  res.send(renderFullPage(t("Blog", lang), content, lang));
});

cs.route('/post/:id', async (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const post = await fetchPublicBlogPost(req.params.id);
  const content = `
    <blog-header lang="${lang}"></blog-header>
    <blog-post post='${JSON.stringify(post)}' lang="${lang}"></blog-post>
  `;
  res.send(renderFullPage(`${t("Blog Post", lang)}: ${post.title}`, content, lang));
});

cs.route('/login', (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const content = `<login-form lang="${lang}"></login-form>`;
  res.send(renderFullPage(t("Login", lang), content, lang));
});

cs.route('/signup', (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const content = `<signup-form lang="${lang}"></signup-form>`;
  res.send(renderFullPage(t("Sign Up", lang), content, lang));
});

// Private routes
cs.route('/dashboard', authenticate, async (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const userPosts = await fetchUserBlogPosts(req.user.id);
  const content = `
    <blog-header lang="${lang}"></blog-header>
    <h1>${t("Welcome", lang)}, ${req.user.username}!</h1>
    <blog-list posts='${JSON.stringify(userPosts)}' lang="${lang}"></blog-list>
  `;
  res.send(renderFullPage(t("Dashboard", lang), content, lang));
});

// Event handlers
cs.on({
  'getBlogPosts': async (client) => {
    const posts = await fetchPublicBlogPosts();
    client.emit('blogPosts', posts);
  },
  'getBlogPost': async (client, { id }) => {
    const post = await fetchPublicBlogPost(id);
    client.emit('blogPost', post);
  },
  'addComment': async (client, { postId, comment }) => {
    if (!client.user) {
      return client.emit('commentError', 'Authentication required');
    }
    await addCommentToPost(postId, comment, client.user.id);
    client.broadcast('newComment', { postId, comment });
  },
  'login': async (client, { username, password }) => {
    const user = users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      client.emit('loginSuccess', { token });
    } else {
      client.emit('loginError', 'Invalid username or password');
    }
  },
  'signup': async (client, { username, password }) => {
    if (users.find(u => u.username === username)) {
      client.emit('signupError', 'Username already exists');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { id: users.length + 1, username, password: hashedPassword };
      users.push(newUser);
      const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
      client.emit('signupSuccess', { token });
    }
  }
});

function renderFullPage(title, content, lang = 'en') {
  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="/centralStation.js"></script>
      <script src="/components.js"></script>
      <style id="dynamic-styles"></style>
    </head>
    <body class="bg-primary text-primary">
      ${content}
      <script src="/app.js"></script>
      <script>
        cs.emit('require', { path: '/styles.css' });
        cs.on('css', (css) => {
          document.getElementById('dynamic-styles').textContent = css;
        });

        // Theme and language handling
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);

        document.getElementById('theme-toggle').addEventListener('click', () => {
          const currentTheme = localStorage.getItem('theme') || 'light';
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          setTheme(newTheme);
        });

        document.getElementById('language-select').addEventListener('change', (e) => {
          localStorage.setItem('lang', e.target.value);
          window.location.reload();
        });

        // Load flag images
        document.querySelectorAll('select option').forEach(option => {
          const lang = option.value;
          cs.emit('require', { path: `/flags/${lang}.svg` });
        });
        cs.on('flag', ({ path, data }) => {
          const lang = path.split('/').pop().split('.')[0];
          const option = document.querySelector(`option[value="${lang}"]`);
          option.style.backgroundImage = `url(data:image/svg+xml;base64,${data})`;
          option.style.backgroundRepeat = 'no-repeat';
          option.style.backgroundPosition = 'left center';
          option.style.paddingLeft = '25px';
        });
      </script>
    </body>
    </html>
  `;
}

cs.start();