const { h, Component } = preact;
const { useState, useEffect } = preactHooks;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    cs.login(username, password);
  };

  return h('div', null, [
    h('input', { type: 'text', value: username, onInput: (e) => setUsername(e.target.value), placeholder: 'Username' }),
    h('input', { type: 'password', value: password, onInput: (e) => setPassword(e.target.value), placeholder: 'Password' }),
    h('button', { onClick: handleLogin }, 'Login')
  ]);
};

const Dashboard = () => {
  return h('div', null, [
    h('h1', null, 'Welcome to the Dashboard')
  ]);
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    cs.on('login', () => setIsAuthenticated(true));
    cs.on('logout', () => setIsAuthenticated(false));
  }, []);

  return h('div', null, [
    isAuthenticated ? h(Dashboard) : h(Login)
  ]);
};

// Register components
cs.registerComponent('App', App);
cs.registerComponent('Login', Login);
cs.registerComponent('Dashboard', Dashboard);

// Initial render
cs.renderComponent('App');