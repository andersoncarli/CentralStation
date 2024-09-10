# CentralStation Library

CentralStation is a powerful, schema-oriented framework for building full-stack web applications with seamless client-server integration.

## 1. Schema-Oriented Development

CentralStation embraces a schema-oriented development approach, where the structure and behavior of your application are defined through schemas.

Key features:
- Define data models and UI components using a unified schema format
- Automatic CRUD operations based on schema definitions
- Dynamic routing generated from schemas
- Extensible schema system for custom behaviors and validations

Example schema:

```javascript
soml({
  name: 'Post',

  fields: {
    id: { type: 'string', primary: true },
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    author: { type: 'string', required: true },
    createdAt: { type: 'date', default: Date.now }
  },

  view: (data) => ({
    article: [
    { h1: data.title },
    { p: data.content },
    { small: By ${data.author} on ${new Date(data.createdAt).toLocaleDateString()} }
  ]})

  });
```


## 2. SOML Data Format

SOML (Simple Object Markup Language) is a lightweight, JSON-like format for defining UI components and layouts.

Features:
- Nested structure for complex layouts
- Attribute support for styling and event handling
- Compact and readable syntax

```javascript
const Button = soml('Button',
  { onClick: () => alert('Clicked!') },
  () => ['Click me']
);

const App = soml('App', () => ({
  div: {
    h1: 'Hello, World!',
    Button: { text: 'Click me', onClick: () => alert('Clicked!') }
  }
})
```

## 3. Automatic Event Handling

CentralStation provides seamless event handling between client and server:

- Unified event system across client and server
- Automatic data synchronization
- Real-time updates using WebSockets

Example:
```javascript
// Server-side
cs.on('post:create', async (data) => {
  const newPost = await db.create('posts', data);
  cs.broadcastState('posts', newPost);
});

// Client-side
cs.emit('post:create',
  { title: 'New Post', content: 'Hello, world!' });

cs.on('posts:update', (posts) => {
  renderPostList(posts) });

const WindowPosition = {
  name: 'WindowPosition',
  fields: { x: 0, y: 0, width: 800, height: 600 },
  view: (data) => ({
  div: {
   style: position: absolute; left: ${data.x}px; top: ${data.y}px; width: ${data.width}px; height: ${data.height}px;,
   // ... window content ...
  }}),
  storage: 'client' // Indicates that this data should be stored in the client-side database
};
// Usage
cs.on('windowPosition:update', (data) => {
cs.db.update('windowPosition', data);
renderWindow(data);
});
```

The schema-centralized web app development approach, when combined with CentralStation and SOML (Simple Object Markup Language), offers numerous benefits and creates a powerful, efficient, and flexible system for building modern web applications. Let's elaborate on these benefits and how they fit together:
1. Schema-Centralized Development:
  - Single Source of Truth: Schemas define both data structure and UI representation, ensuring consistency across the entire application.
  - Automatic CRUD Operations: The system can generate database operations, API endpoints, and basic UI components based on the schema, reducing boilerplate code.
  - Validation: Built-in data validation based on schema definitions, ensuring data integrity at all levels.
  - Easy Extensibility: Adding new features often involves just creating a new schema, with much of the underlying functionality automatically handled.
2.  CentralStation:
  - Unified Client-Server Communication: Handles both HTTP requests and WebSocket connections, simplifying real-time updates.
  - Automatic State Management: Manages application state and synchronizes it between server and client.
  - Event-Driven Architecture: Facilitates loose coupling between components and easy integration of new features.
  - Built-in Theming and Internationalization: Supports multiple themes and languages out of the box.
3. SOML (Simple Object Markup Language):
  - Lightweight and Readable: As you mentioned, SOML is to HTML what JSON is to XML - a more concise and developer-friendly syntax.
  - JavaScript Native: Being a JavaScript object-based syntax, it's easy to generate, manipulate, and understand for JavaScript developers.
  - Isomorphic: The same SOML can be used on both server and client, enabling true isomorphic applications.
  - Extensible: Easy to add plugins for converting SOML to various formats (HTML, DOM, etc.)

The synergy between these three concepts creates a powerful development ecosystem:
1. Rapid Development: Schemas define both data and UI, CentralStation handles communication and state, and SOML provides a simple way to describe components. This combination significantly speeds up development time.
1. Consistency: The schema ensures data consistency, CentralStation maintains state consistency across client and server, and SOML ensures UI consistency.
1. Flexibility: While providing structure, the system remains flexible. Developers can easily override default behaviors, add custom logic, or extend the system as needed.
1. Isomorphic by Design: The same code can often run on both client and server, improving performance and SEO while maintaining a rich client-side experience.
5. Real-time Capabilities: CentralStation's WebSocket integration combined with schema-driven events makes building real-time features straightforward.
6. Developer Experience: The declarative nature of schemas and SOML, combined with CentralStation's automatic handling of many common tasks, allows developers to focus on business logic rather than boilerplate.
7. Maintainability: With clear separation of concerns and a consistent structure throughout the application, the codebase becomes more maintainable over time.
1. Scalability: The modular nature of this approach makes it easier to scale applications, both in terms of codebase size and performance.

In essence, this approach creates a development environment where the schema acts as a contract between different parts of the system, CentralStation ensures this contract is upheld and facilitates communication, and SOML provides a simple, efficient way to describe the UI based on this contract. This synergy results in a powerful, flexible, and developer-friendly system for building modern web applications.
