const CentralStation = require('../CentralStation');

describe('CentralStation', () => {
  let cs;

  beforeEach(() => {
    cs = new CentralStation({ port: 3000 });
  });

  test('constructor sets default options', () => {
    expect(cs.options.port).toBe(3000);
    expect(cs.options.jwtSecret).toBe('your-secret-key');
  });

  test('route method adds a new route', () => {
    const handler = jest.fn();
    cs.route('/test', handler);
    expect(cs.routes.get('/test')).toBe(handler);
  });

  test('use method adds middleware', () => {
    const middleware = jest.fn();
    cs.use(middleware);
    expect(cs.middleware).toContain(middleware);
  });
});