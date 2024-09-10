function soml(tag, props = {}, ...children) {
  if (typeof tag === 'object') {
    // Handle the case where the first argument is an object
    return Object.entries(tag).map(([key, value]) =>
      soml(key, {}, value)
    );
  }

  const element = { $: tag };

  if (Object.keys(props).length > 0) element._ = props;

  if (children.length > 0) {
    element[''] = children.flat().map(child =>
      typeof child === 'object' && !Array.isArray(child) ? soml(child) : child
    );
  }

  return element;
}

soml.createComponent = (name, render) => {
  return (props = {}) => {
    const result = render(props);
    return Array.isArray(result) ? { $: name, '': result } : { $: name, ...result };
  };
};

// Example usage
const Button = soml.createComponent('Button', ({ text, onClick }) =>
  soml('button', { onClick }, text)
);

const App = soml.createComponent('App', () => soml({
  div: {
    h1: 'Hello, World!',
    Button: { text: 'Click me', onClick: () => alert('Clicked!') }
  }
}));

// Plugins
soml.toHtml = (element) => {
  if (typeof element === 'string') return element;
  if (Array.isArray(element)) return element.map(soml.toHtml).join('');

  const { $: tag, _: props = {}, '': children = [] } = element;
  const attrs = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  const childrenHtml = children.map(soml.toHtml).join('');
  return `<${tag} ${attrs}>${childrenHtml}</${tag}>`;
};

soml.toDom = (element, document = window.document) => {
  if (typeof element === 'string') return document.createTextNode(element);
  if (Array.isArray(element)) {
    const fragment = document.createDocumentFragment();
    element.forEach(child => fragment.appendChild(soml.toDom(child, document)));
    return fragment;
  }

  const { $: tag, _: props = {}, '': children = [] } = element;
  const el = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });

  children.forEach(child => el.appendChild(soml.toDom(child, document)));
  return el;
};

soml.fromHtml = (htmlString) => {
  // This is a simplified version and might need more robust parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return soml.fromDom(doc.body.firstChild);
};

soml.fromDom = (domElement) => {
  if (domElement.nodeType === Node.TEXT_NODE) return domElement.textContent;

  const tag = domElement.tagName.toLowerCase();
  const props = {};
  Array.from(domElement.attributes).forEach(attr => {
    props[attr.name] = attr.value;
  });

  const children = Array.from(domElement.childNodes).map(soml.fromDom);

  return soml(tag, props, ...children);
};

// Update extractClassesFromComponents function
function extractClassesFromComponents() {
  const extractClasses = (element) => {
    if (typeof element !== 'object') return [];
    const { _: props = {}, '': children = [] } = element;
    const classNames = props.class ? props.class.split(' ') : [];
    return [
      ...classNames,
      ...children.flatMap(extractClasses)
    ];
  };

  return Object.values(soml.components || {}).flatMap(extractClasses);
}

// The rest of the code (processCss, themes, translations, etc.) remains the same