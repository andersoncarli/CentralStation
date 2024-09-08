const events = {};

export function addEvent(event, callback) {
  if (!events[event]) {
    events[event] = [];
  }
  events[event].push(callback);
}

export function emitEvent(event, data) {
  if (events[event]) {
    events[event].forEach(callback => callback(data));
  }
}

export default events;