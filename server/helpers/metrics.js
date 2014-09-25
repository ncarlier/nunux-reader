var logger = require('./logger');

if (process.env.APP_METRICS_LOGGER === 'true') {
  setInterval(function () {
    var startTime = Date.now();
    setImmediate(function () {
      var data = process.memoryUsage();
      data.uptime = process.uptime();
      data.pid = process.pid;
      data.tags = ['process-metrics']; 
      data.lag = Date.now()-startTime;
      logger.info(data,
                  'process.pid: %d heapUsed: %d heapTotal: %d rss: %d uptime %d lag: %d',
                  data.pid,
                  data.heapUsed,
                  data.heapTotal,
                  data.rss,
                  data.uptime,
                  data.lag
                 );
    });
  }, 5000);
}
