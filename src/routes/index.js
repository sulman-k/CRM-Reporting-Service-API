const express = require("express"),
  configure_reports_mst = require(`${__controllers}/configure-reports-mst`),
  configure_reports_dtl = require(`${__controllers}/configure-reports-dtl`),
  scheduled_reports = require(`${__controllers}/scheduled-reports`),
  dashboard = require(`${__controllers}/dashboard`),
  router = express.Router();

require(`${__routes}/configure-reports-mst`)(router, configure_reports_mst);
require(`${__routes}/configure-reports-dtl`)(router, configure_reports_dtl);
require(`${__routes}/scheduled-reports`)(router, scheduled_reports);
require(`${__routes}/dashboard`)(router, dashboard);

// Default Routes, This line should be the last line of this module.
require(`${__routes}/default`)(router);

module.exports = router;
