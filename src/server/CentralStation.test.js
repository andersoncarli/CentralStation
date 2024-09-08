const CentralStation = require('../src/CentralStation');
const { addEvent, emitEvent } = require('../src/utils/events');
const { addRoute, getRoute } = require('../src/utils/routes');

jest.mock('../src/services/websocket', () => ({
  connectWebSocket: jest.fn((url, onMessage) => ({
    send: jest.fn(),
    onmessage: onMessage,
  })),
}));

jest.mock('../src/services/auth', () => ({
  login: jest.fn(() => Promise.resolve('fake-token')),
  signup: jest.fn(() => Promise.resolve('fake-token')),
  logout: jest.fn(),
}));

describe('CentralStation', () => {
  let cs;

  beforeEach(() => {
    cs = new CentralStation();
  });

  test('initializes correctly', () => {
    expect(cs).toBeDefined();
  });

  test('handles WebSocket messages', () => {
    const message = { event: 'testEvent', payload: 'testPayload' };
    cs.ws.onmessage({ data: JSON.stringify(message) });
    expect(cs.ws.onmessage).toBeDefined();
  });

  test('emits events', () => {
    const event = 'testEvent';
    const data = 'testData';
    cs.emit(event, data);
    expect(cs.ws.send).toHaveBeenCalledWith(JSON.stringify({ event, data }));
  });

  test('registers event handlers', () => {
    const event = 'testEvent';
    const callback = jest.fn();
    cs.on(event, callback);
    emitEvent(event, 'testData');
    expect(callback).toHaveBeenCalledWith('testData');
  });

  test('handles routes', () => {
    const path = '/test';
    const callback = jest.fn();
    cs.route(path, callback);
    cs.navigate(path);
    expect(callback).toHaveBeenCalled();
  });

  test('login', async () => {
    await cs.login('username', 'password');
    expect(cs.token).toBe('fake-token');
  });

  test('signup', async () => {
    await cs.signup('username', 'password');
    expect(cs.token).toBe('fake-token');
  });

  test('logout', () => {
    cs.logout();
    expect(cs.token).toBeNull();
  });
});
