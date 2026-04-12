const removeLeadingZeros = require('./removeLeadingZeros');

const toCron = (time) => {
  const [hour, minute] = time.split(':').map(removeLeadingZeros);
  return `${minute} ${hour} * * *`;
};

module.exports = toCron;
