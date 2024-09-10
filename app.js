const CentralStation = require('./src/soml');

const cs = new CentralStation();

// Define components
const Header = () => ({
  header: {
    nav: [
      { a: { href: '/', text: 'Home' } },
      { a: { href: '/posts', text: 'Blog' } },
      { a: { href: '/tasks', text: 'Tasks' } },
    ]
  }
});

const PostList = (props) => ({
  ul: props.posts.map(post => ({
    li: { a: { href: `/post/${post.id}`, text: post.title } }
  }))
});

const Post = (props) => ({
  article: [
    { h1: props.post.title },
    { p: props.post.content },
    { small: `By ${props.post.author} on ${new Date(props.post.date).toLocaleDateString()}` }
  ]
});

const TaskList = (props) => ({
  ul: props.tasks.map(task => ({
    li: [
      { span: task.title },
      { input: { type: 'checkbox', checked: task.completed, onChange: () => cs.emit('task:update', { id: task.id, completed: !task.completed }) } }
    ]
  }))
});

const App = (props) => ({
  div: [
    Header(),
    { main: props.children }
  ]
});

// Define routes
cs.route('/', async () => {
  await cs.emit('post:fetch', { options: { limit: 5, sort: { date: -1 } } });
  return App({ children: PostList({ posts: cs.state.posts }) });
});

cs.route('/posts', async () => {
  await cs.emit('post:fetch', { options: { sort: { date: -1 } } });
  return App({ children: PostList({ posts: cs.state.posts }) });
});

cs.route('/post/:id', async (req) => {
  await cs.emit('post:fetch', { query: { id: req.params.id } });
  const post = cs.state.posts.find(p => p.id === req.params.id);
  return App({ children: Post({ post }) });
});

cs.route('/tasks', async () => {
  await cs.emit('task:fetch', { options: { sort: { date: -1 } } });
  return App({ children: TaskList({ tasks: cs.state.tasks }) });
});

// Define event handlers
cs.on('post:update', (posts) => {
  console.log('Posts updated:', posts);
  // Update UI if needed
});

cs.on('task:update', (tasks) => {
  console.log('Tasks updated:', tasks);
  // Update UI if needed
});

// Start the application
cs.start();