const cs = new CentralStation({ url: 'ws://localhost:3000' });
const $ = document.querySelector.bind(document);

const Login = () => `
  <form id="loginForm">
    <input type="text" id="username" placeholder="Username" required autocomplete="username">
    <input type="password" id="password" placeholder="Password" required autocomplete="current-password">
    <button type="submit">Login</button>
  </form>
  <p>Don't have an account? <a href="/signup" id="showSignup">Sign up</a></p>
`;

const Signup = () => `
  <form id="signupForm">
    <input type="text" id="newUsername" placeholder="Username" required autocomplete="username">
    <input type="password" id="newPassword" placeholder="Password" required autocomplete="new-password">
    <button type="submit">Sign Up</button>
  </form>
  <p>Already have an account? <a href="/" id="showLogin">Login</a></p>
`;

const Dashboard = (username, time, mousePosition) => `
  <div>
    <h1>Welcome to the Dashboard, ${username}!</h1>
    <p>Current time: ${time}</p>
    <p>Mouse position: x=${mousePosition.x}, y=${mousePosition.y}</p>
    <button id="logoutBtn">Logout</button>
  </div>
`;

const App = async () => {
  let isLoggedIn = false;
  let username = '';
  let time = null;
  let mousePosition = { x: 0, y: 0 };
  const timeFormatter = await cs.require('timeFormatter');

  const render = () => {
    if (isLoggedIn) {
      $('body').innerHTML = Dashboard(username, timeFormatter.format(time), mousePosition);
      $('#logoutBtn').onclick = () => cs.logout();
    } else {
      $('body').innerHTML = location.pathname === '/signup' ? Signup() : Login();
      $('form').onsubmit = (e) => {
        e.preventDefault();
        const isSignup = e.target.id === 'signupForm';
        const usernameField = isSignup ? '#newUsername' : '#username';
        const passwordField = isSignup ? '#newPassword' : '#password';
        const username = $(usernameField)?.value;
        const password = $(passwordField)?.value;
        if (username && password) {
          const action = isSignup ? cs.signup : cs.login;
          action.call(cs, username, password);
        } else {
          alert('Please enter both username and password');
        }
      };
    }
  };

  cs.on('authStateChange', (loggedIn) => { isLoggedIn = loggedIn; render(); });
  cs.on('authSuccess', (data) => { username = data.username; isLoggedIn = true; render(); });
  cs.on('timeUpdate', (newTime) => { time = newTime; if (isLoggedIn) render(); });
  cs.on('signupSuccess', () => { alert('Signup successful! Please log in.'); location.href = '/'; });
  ['signupError', 'authError'].forEach(event => cs.on(event, (error) => alert(error.message)));

  document.onmousemove = (e) => {
    mousePosition = { x: e.clientX, y: e.clientY };
    cs.emit('mouseMove', mousePosition);
    if (isLoggedIn) render();
  };

  window.onpopstate = render;
  render();
};

// Wait for the DOM to be fully loaded before initializing the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App);
} else {
  App();
}