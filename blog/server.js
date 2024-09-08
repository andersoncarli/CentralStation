const CentralStation = require('../src/server/CentralStation');

const cs = new CentralStation({ port: 3000 });

cs.route('/', async (req, res, context) => {
  const posts = await fetchPublicBlogPosts();
  context.title = "Blog";
  return `
    <blog-header></blog-header>
    <h1>Welcome to our blog</h1>
    <blog-list posts='${JSON.stringify(posts)}'></blog-list>
  `;
});

cs.route('/post/:id', async (req, res, context) => {
  const post = await fetchPublicBlogPost(req.params.id);
  context.title = `Blog Post: ${post.title}`;
  return `
    <blog-header></blog-header>
    <blog-post post='${JSON.stringify(post)}'></blog-post>
  `;
});

cs.route('/login', (req, res, context) => {
  context.title = "Login";
  return `<login-form></login-form>`;
});

cs.route('/signup', (req, res, context) => {
  context.title = "Sign Up";
  return `<signup-form></signup-form>`;
});

cs.start();