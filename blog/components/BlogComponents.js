import { component, t } from '../centralStation.js';
import { marked } from 'marked';

export const Header = component('blog-header', function() {
  const currentLang = this.getAttribute('lang') || 'en';
  return `
    <header class="bg-primary text-primary py-4">
      <nav class="container mx-auto flex justify-between items-center px-4">
        <a href="/" class="text-2xl font-bold">${t("My Blog", currentLang)}</a>
        <div class="flex items-center space-x-4">
          <a href="/">${t("Home", currentLang)}</a>
          <a href="/blog">${t("Blog", currentLang)}</a>
          <select id="language-select" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
          <button id="theme-toggle" class="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8.66-8.66h-1M4.34 12H3m15.66 4.34l-.7-.7m-11.32 0l-.7.7m11.32-11.32l-.7.7m-11.32 0l-.7-.7M12 5a7 7 0 100 14 7 7 0 000-14z"></path>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  `;
});

export const BlogList = component('blog-list', function() {
  const posts = this.getAttribute('posts') ? JSON.parse(this.getAttribute('posts')) : [];
  return `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Blog Posts</h1>
      ${posts.map(post => `
        <div class="mb-6">
          <h2 class="text-2xl font-semibold mb-2">
            <a href="/post/${post.id}" class="text-blue-600 hover:text-blue-800">${post.title}</a>
          </h2>
          <p class="text-gray-600">${post.excerpt}</p>
        </div>
      `).join('')}
    </div>
  `;
});

export const BlogPost = component('blog-post', function() {
  const post = this.getAttribute('post') ? JSON.parse(this.getAttribute('post')) : {};
  return `
    <article class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4">${post.title}</h1>
      <p class="text-gray-600 mb-6">Published on ${post.date}</p>
      <div class="prose lg:prose-xl">
        ${marked(post.content)}
      </div>
    </article>
  `;
});

export const LoginForm = component('login-form', function() {
  const currentLang = this.getAttribute('lang') || 'en';
  return `
    <form class="max-w-md mx-auto mt-8">
      <h2 class="text-2xl font-bold mb-4">${t("Login", currentLang)}</h2>
      <div class="mb-4">
        <label for="username" class="block mb-2">${t("Username", currentLang)}</label>
        <input type="text" id="username" name="username" required class="w-full px-3 py-2 border rounded">
      </div>
      <div class="mb-4">
        <label for="password" class="block mb-2">${t("Password", currentLang)}</label>
        <input type="password" id="password" name="password" required class="w-full px-3 py-2 border rounded">
      </div>
      <button type="submit" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">${t("Login", currentLang)}</button>
    </form>
  `;
});

export const SignupForm = component('signup-form', () => `
  <form class="max-w-md mx-auto mt-8">
    <h2 class="text-2xl font-bold mb-4">Sign Up</h2>
    <div class="mb-4">
      <label for="username" class="block mb-2">Username</label>
      <input type="text" id="username" name="username" required class="w-full px-3 py-2 border rounded">
    </div>
    <div class="mb-4">
      <label for="password" class="block mb-2">Password</label>
      <input type="password" id="password" name="password" required class="w-full px-3 py-2 border rounded">
    </div>
    <button type="submit" class="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">Sign Up</button>
  </form>
`);

export const LoginPage = component('login-page', function() {
  return `
    <div class="container mx-auto mt-8">
      <h1 class="text-3xl font-bold mb-4">Login</h1>
      <login-form></login-form>
    </div>
  `;
});

export const SignupPage = component('signup-page', function() {
  return `
    <div class="container mx-auto mt-8">
      <h1 class="text-3xl font-bold mb-4">Sign Up</h1>
      <signup-form></signup-form>
    </div>
  `;
});