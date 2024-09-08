import CentralStation from '../src/client/CentralStation';

const cs = new CentralStation({ url: 'ws://localhost:3000' });

cs.login = (username, password) => {
  cs.emit('auth', { username, password });
};

cs.logout = () => {
  cs.emit('logout');
};

export default cs;