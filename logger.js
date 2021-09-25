const { createLogger, transports, format } = require('winston')

const logFormat = format.combine(format.timestamp(), format.printf((info) => {
  return `${info.timestamp} - [${info.level.toUpperCase().padEnd(7)}] - ${info.message}`;
}));

const logger = createLogger({
  format: logFormat,
  transports: [
    // new transports.Console(),
    new transports.File({ filename: 'logs/app.log', maxsize: 1000000 })
  ]
});

module.exports = logger;


