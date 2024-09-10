const CentralStation = require('../src/server/CentralStation');
const soml = require('../src/server/soml');

const cs = new CentralStation({ port: 3000 });

// Components
const Header = soml('Header', () => ({
  header: {
    nav: [
      { a: { href: '/', text: 'Home' } },
      { a: { href: '/posts', text: 'Blog' } },
      { a: { href: '/tasks', text: 'Tasks' } },
    ]
  }
}));

const PostList = soml('PostList', (props) => ({
  ul: props.posts.map(post => ({
    li: { a: { href: `/post/${post.id}`, text: post.title } }
  }))
}));

const Post = soml('Post', (props) => ({
  article: [
    { h1: props.post.title },
    { p: props.post.content },
    { small: `By ${props.post.author} on ${new Date(props.post.date).toLocaleDateString()}` }
  ]
}));

const TaskList = soml('TaskList', (props) => ({
  ul: props.tasks.map(task => ({
    li: [
      { span: task.title },
      { input: { type: 'checkbox', checked: task.completed, onChange: () => cs.emit('task:update', { id: task.id, completed: !task.completed }) } }
    ]
  }))
}));

const App = soml('App', (props) => ({
  div: [
    Header(),
    { main: props.children }
  ]
}));

// Routes
cs.route('/', async (req, res, { theme, lang }) => {
  const posts = await cs.handleDataEvent('post:fetch', { options: { limit: 5, sort: { date: -1 } } });
  return {
    title: t('Home', lang),
    content: App({
      children: PostList({ posts }),
      theme,
      lang
    })
  };
});

cs.route('/posts', async (req, res) => {
  await cs.handleDataEvent('post:fetch', { options: { sort: { date: -1 } } });
  return App({ children: PostList({ posts: cs.state.posts }) });
});

cs.route('/post/:id', async (req, res, { theme, lang }) => {
  const post = await cs.handleDataEvent('post:fetch', { query: { id: req.params.id } });
  return {
    title: t(post.title, lang),
    content: App({
      children: Post({ post }),
      theme,
      lang
    })
  };
});

cs.route('/tasks', async (req, res) => {
  await cs.handleDataEvent('task:fetch', { options: { sort: { date: -1 } } });
  return App({ children: TaskList({ tasks: cs.state.tasks }) });
});

// ... (other routes)

function t(key, lang) {
  return cs.translations[lang][key] || key;
}

cs.start();