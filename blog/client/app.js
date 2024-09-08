const cs = new CentralStation({ url: 'ws://localhost:3000' });
const $ = document.querySelector.bind(document);

const Header = () => `
  <header class="bg-gray-100 dark:bg-gray-800 py-4">
    <nav class="container mx-auto flex justify-between items-center px-4">
      <a href="#" class="text-2xl font-bold">My Blog</a>
      <div class="flex items-center space-x-4">
        <a href="#">Home</a>
        <a href="#">Blog</a>
        <select class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button class="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8.66-8.66h-1M4.34 12H3m15.66 4.34l-.7-.7m-11.32 0l-.7.7m11.32-11.32l-.7.7m-11.32 0l-.7-.7M12 5a7 7 0 100 14 7 7 0 000-14z"></path>
          </svg>
        </button>
      </div>
    </nav>
  </header>
`;

const Blog = (posts) => `
  <div>
    ${Header()}
    <h1>Blog</h1>
    ${posts.map(post => `
      <div>
        <h2>${post.title}</h2>
        <p>${post.content}</p>
      </div>
    `).join('')}
  </div>
`;

const App = async () => {
  let posts = [];
  const render = () => {
    $('body').innerHTML = Blog(posts);
  };

  cs.on('blogPosts', (data) => {
    posts = data;
    render();
  });

  cs.emit('getBlogPosts');
  render();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App);
} else {
  App();
}