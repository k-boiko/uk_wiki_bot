module.exports.chunkBy = (array, chunkLength) => {
  const R = [];
  for (let i = 0; i < array.length; i += chunkLength) {
    R.push(array.slice(i, i + chunkLength));
  }
  return R;
};

module.exports.addLeadingZero = x => `${x}`.padStart(2, '0');
