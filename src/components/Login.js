import { h } from 'preact';
import { useState } from 'preact/hooks';
import CentralStation from '../CentralStation';

const cs = new CentralStation();

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    cs.login(username, password);
  };

  return (
    <div>
      <input type="text" value={username} onInput={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onInput={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
