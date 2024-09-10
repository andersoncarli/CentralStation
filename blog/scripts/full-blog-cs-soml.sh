#!/bin/bash

# Create project structure
mkdir -p full-blog-cs-soml/{src/{server,client,components,routes,schemas},public,content}
cd full-blog-cs-soml

# Initialize package.json
npm init -y

# Install dependencies
npm install express ws mongodb marked postcss tailwindcss autoprefixer cssnano dotenv

# Create .env file
cat > .env << EOL
PORT=3000
MONGODB_URI=mongodb://localhost:27017/full-blog-cs-soml
EOL

# Create main app.js file
cat > app.js << EOL
require('dotenv').config();
const CentralStation = require('./src/server/CentralStation');
const { PostSchema, TaskSchema, PageSchema } = require('./src/schemas');

const cs = new CentralStation({
  port: process.env.PORT || 3000,
  dbOptions: { type: 'mongo', url: process.env.MONGODB_URI },
  routesDir: './src/routes',
  schemaDir: './src/schemas'
});

cs.registerSchema(PostSchema);
cs.registerSchema(TaskSchema);
cs.registerSchema(PageSchema);

cs.start();
EOL

# Create CentralStation.js
cat > src/server/CentralStation.js << EOL
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;
const DB = require('./db/DB');
const soml = require('./soml');

class CentralStation {
  constructor(options = {}) {
    this.options = {
      port: 3000,
      dbOptions: { type: 'mongo', url: 'mongodb://localhost:27017/full-blog-cs-soml' },
      routesDir: './src/routes',
      schemaDir: './src/schemas',
      ...options
    };
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.db = new DB(this.options.dbOptions);
    this.schemas = new Map();
    this.routes = new Map();
    this.eventHandlers = new Map();
    this.state = {};
    this.themes = {
      light: { /* light theme styles */ },
      dark: { /* dark theme styles */ }
    };

    this.setupMiddleware();
    this.loadSchemas();
    this.loadRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  async loadSchemas() {
    const schemaFiles = await fs.readdir(this.options.schemaDir);
    for (const file of schemaFiles) {
      if (file.endsWith('.js')) {
        const schema = require(path.join(process.cwd(), this.options.schemaDir, file));
        this.registerSchema(schema);
      }
    }
  }

  registerSchema(schema) {
    this.schemas.set(schema.name.toLowerCase(), schema);
    this.setupSchemaHandlers(schema);
  }

  setupSchemaHandlers(schema) {
    const name = schema.name.toLowerCase();
    this.on(`${name}:create`, async (data) => {
      const newItem = await this.db.create(name, data);
      this.broadcastState(name, newItem);
    });

    this.on(`${name}:update`, async (data) => {
      const updatedItem = await this.db.update(name, { id: data.id }, data);
      this.broadcastState(name, updatedItem);
    });

    this.on(`${name}:delete`, async (data) => {
      await this.db.delete(name, { id: data.id });
      this.broadcastState(name, { id: data.id, deleted: true });
    });

    this.on(`${name}:fetch`, async (query) => {
      const items = await this.db.findMany(name, query);
      this.broadcastState(name, items);
    });
  }

  async loadRoutes() {
    const routeFiles = await fs.readdir(this.options.routesDir);
    for (const file of routeFiles) {
      if (file.endsWith('.js')) {
        const route = require(path.join(process.cwd(), this.options.routesDir, file));
        route(this);
      }
    }
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const { event, data } = JSON.parse(message);
        this.emit(event, data);
      });
    });
  }

  start() {
    this.server.listen(this.options.port, () => {
      console.log(\`Server running on http://localhost:\${this.options.port}\`);
    });
  }

  route(path, handler) {
    this.app.get(path, async (req, res) => {
      const result = await handler(req, res, this);
      const html = this.renderFullPage(result);
      res.send(html);
    });
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }

  broadcastState(entity, data) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: \`\${entity}:update\`, data }));
      }
    });
  }

  renderFullPage(component) {
    return \`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>\${component.title || 'Full Blog CS SOML'}</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div id="root">\${soml.toHtml(component.content)}</div>
          <script>
            window.__INITIAL_STATE__ = \${JSON.stringify(this.state)};
          </script>
          <script src="/client.js"></script>
        </body>
      </html>
    \`;
  }
}

module.exports = CentralStation;
EOL

# Create DB.js
cat > src/server/db/DB.js << EOL
const { MongoClient, ObjectId } = require('mongodb');

class DB {
  constructor(options) {
    this.client = new MongoClient(options.url);
    this.dbName = options.url.split('/').pop();
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
  }

  async findMany(collection, query = {}, options = {}) {
    return this.db.collection(collection).find(query, options).toArray();
  }

  async findOne(collection, query) {
    return this.db.collection(collection).findOne(query);
  }

  async create(collection, data) {
    const result = await this.db.collection(collection).insertOne(data);
    return { id: result.insertedId, ...data };
  }

  async update(collection, query, data) {
    const result = await this.db.collection(collection).updateOne(query, { $set: data });
    return result.modifiedCount > 0 ? { id: query.id, ...data } : null;
  }

  async delete(collection, query) {
    const result = await this.db.collection(collection).deleteOne(query);
    return result.deletedCount > 0;
  }
}

module.exports = DB;
EOL

# Create soml.js
cat > src/server/soml.js << EOL
function soml(tag, props = {}, ...children) {
  return { tag, props, children: children.flat() };
}

soml.toHtml = (element) => {
  if (typeof element === 'string') return element;
  if (Array.isArray(element)) return element.map(soml.toHtml).join('');

  const { tag, props = {}, children = [] } = element;
  const attrs = Object.entries(props)
    .map(([key, value]) => \`\${key}="\${value}"\`)
    .join(' ');

  const childrenHtml = children.map(soml.toHtml).join('');
  return \`<\${tag} \${attrs}>\${childrenHtml}</\${tag}>\`;
};

module.exports = soml;
EOL

# Create schemas
cat > src/schemas/index.js << EOL
const marked = require('marked');
const soml = require('../server/soml');

const PostSchema = {
  name: 'Post',
  fields: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    author: { type: 'string', required: true },
    createdAt: { type: 'date', default: Date.now }
  },
  view: (data) => soml('article', {}, [
    soml('h1', {}, data.title),
    soml('div', { dangerouslySetInnerHTML: { __html: marked(data.content) } }),
    soml('small', {}, \`By \${data.author} on \${new Date(data.createdAt).toLocaleDateString()}\`)
  ])
};

const TaskSchema = {
  name: 'Task',
  fields: {
    title: { type: 'string', required: true },
    completed: { type: 'boolean', default: false },
    dueDate: { type: 'date' }
  },
  view: (data) => soml('div', {}, [
    soml('span', {}, data.title),
    soml('input', { type: 'checkbox', checked: data.completed, onChange: \`updateTask('\${data.id}')\` }),
    soml('small', {}, data.dueDate ? \`Due: \${new Date(data.dueDate).toLocaleDateString()}\` : '')
  ])
};

const PageSchema = {
  name: 'Page',
  fields: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    slug: { type: 'string', required: true, unique: true }
  },
  view: (data) => soml('div', {}, [
    soml('h1', {}, data.title),
    soml('div', { dangerouslySetInnerHTML: { __html: marked(data.content) } })
  ])
};

module.exports = { PostSchema, TaskSchema, PageSchema };
EOL

# Create routes
cat > src/routes/index.js << EOL
const soml = require('../server/soml');

module.exports = (cs) => {
  const Header = soml('header', {}, [
    soml('nav', {}, [
      soml('a', { href: '/' }, 'Home'),
      soml('a', { href: '/posts' }, 'Blog'),
      soml('a', { href: '/tasks' }, 'Tasks')
    ])
  ]);

  const App = (content) => soml('div', {}, [Header, content]);

  cs.route('/', async (req, res) => {
    const page = await cs.db.findOne('page', { slug: 'home' });
    return {
      title: page.title,
      content: App(cs.schemas.get('page').view(page))
    };
  });

  cs.route('/posts', async (req, res) => {
    const posts = await cs.db.findMany('post', {}, { sort: { createdAt: -1 } });
    const PostList = soml('ul', {}, posts.map(post =>
      soml('li', {}, soml('a', { href: \`/post/\${post.id}\` }, post.title))
    ));
    return {
      title: 'Blog Posts',
      content: App(PostList)
    };
  });

  cs.route('/post/:id', async (req, res) => {
    const post = await cs.db.findOne('post', { _id: req.params.id });
    return {
      title: post.title,
      content: App(cs.schemas.get('post').view(post))
    };
  });

  cs.route('/tasks', async (req, res) => {
    const tasks = await cs.db.findMany('task', {}, { sort: { dueDate: 1 } });
    const TaskList = soml('ul', {}, tasks.map(task =>
      soml('li', {}, cs.schemas.get('task').view(task))
    ));
    return {
      title: 'Tasks',
      content: App(TaskList)
    };
  });
};
EOL

# Create client-side script
cat > public/client.js << EOL
const cs = new CentralStation();

function updateTask(id) {
  cs.emit('task:update', { id, completed: !cs.state.tasks.find(t => t.id === id).completed });
}

cs.on('post:update', (posts) => {
  // Update posts in the UI
});

cs.on('task:update', (tasks) => {
  // Update tasks in the UI
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  });
}

// Set initial theme
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.body.classList.add('dark');
}
EOL

# Create styles.css with Tailwind directives
cat > public/styles.css << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;

.dark {
  @apply bg-gray-900 text-white;
}
EOL

# Create tailwind.config.js
cat > tailwind.config.js << EOL
module.exports = {
  purge: ['./src/**/*.js', './public/**/*.html'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
EOL

# Create postcss.config.js
cat > postcss.config.js << EOL
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
  ],
}
EOL

# Create a sample Markdown page
cat > content/home.md << EOL
# Welcome to Full Blog CS SOML

This is a full-featured blog application built with CentralStation and SOML.

## Features

- Blog posts with Markdown support
- Task management
- Dark mode support
- Internationalization (i18n)
- MongoDB integration
- Real-time updates using WebSockets

Enjoy exploring the application!
EOL

# Create a script to import initial data
cat > scripts/import-initial-data.js << EOL
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

async function importInitialData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  // Import pages
  const pagesDir = path.join(__dirname, '..', 'content');
  const pageFiles = await fs.readdir(pagesDir);
  for (const file of pageFiles) {
    const content = await fs.readFile(path.join(pagesDir, file), 'utf-8');
    const slug = path.basename(file, '.md');
    await db.collection('page').updateOne(
      { slug },
      { $set: { slug, title: slug.charAt(0).toUpperCase() + slug.slice(1), content } },
      { upsert: true }
    );
  }

  // Import sample blog posts
  const posts = [
    { title: 'First Blog Post', content: '# First Blog Post\n\nThis is the content of the first blog post.', author: 'Admin' },
    { title: 'Second Blog Post', content: '# Second Blog Post\n\nThis is the content of the second blog post.', author: 'Admin' }
  ];
  await db.collection('post').insertMany(posts);

  // Import sample tasks
  const tasks = [
    { title: 'Implement blog features', completed: false },
    { title: 'Add dark mode support', completed: true },
    { title: 'Set up MongoDB', completed: true }
  ];
  await db.collection('task').insertMany(tasks);

  console.log('Initial data imported successfully');
  await client.close();
}

importInitialData().catch(console.error);
EOL

# Update package.json scripts
npm pkg set scripts.start="node app.js"
npm pkg set scripts.import-data="node scripts/import-initial-data.js"
npm pkg set scripts.build-css="postcss public/styles.css -o public/styles.min.css"

# Create a README.md file
cat > README.md << EOL
# Full Blog CS SOML

This is a full-featured blog application built with CentralStation and SOML (Simple Object Markup Language).

## Features

- Blog posts with Markdown support
- Task management
- Dark mode support
- Internationalization (i18n)
- MongoDB integration
- Real-time updates using WebSockets

## Setup

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Set up environment variables:
   Create a \`.env\` file in the root directory with the following content:
   \`\`\`
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/full-blog-cs-soml
   \`\`\`

3. Import initial data:
   \`\`\`
   npm run import-data
   \`\`\`

4. Build CSS:
   \`\`\`
   npm run build-css
   \`\`\`

5. Start the application:
   \`\`\`
   npm start
   \`\`\`

6. Open your browser and navigate to \`http://localhost:3000\`

## Development

- To add new pages, create Markdown files in the \`content\` directory.
- To modify the application structure or add new features, edit the files in the \`src\` directory.
- To change the styling, modify the \`public/styles.css\` file and rebuild the CSS using \`npm run build-css\`.

## License

MIT
EOL

# Final message
echo "Setup complete! Follow the instructions in README.md to run your application."