const removeLeadingZeros = (str) => String(parseInt(str, 10));
const toCron = (time) => {
  const [hour, minute] = time.split(':').map(removeLeadingZeros);
  return `${minute} ${hour} * * *`;
};

module.exports = {
  removeLeadingZeros,
  toCron
};