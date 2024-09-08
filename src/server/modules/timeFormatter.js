exports.format = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};