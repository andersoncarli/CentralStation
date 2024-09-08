import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import CentralStation from '../CentralStation';
import Login from './Login';
import Dashboard from './Dashboard';

const cs = new CentralStation();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    cs.on('login', () => setIsAuthenticated(true));
    cs.on('logout', () => setIsAuthenticated(false));
  }, []);

  return (
    <div>
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
};

export default App;
