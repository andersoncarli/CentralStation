const routes = {};

export function addRoute(path, callback) {
  routes[path] = callback;
}

export function getRoute(path) {
  return routes[path];
}

export default routes;
