const { query } = require("../config/sqlDatabase");
const _ = require("underscore");
var moment = require("moment"); // require
const moduleName = "[dashboard]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.dateWiseScdRpt = async (req, res) => {
  try {
    logger.info("[dateWiseScdRpt][query]", req.query);

    let result =
      await query(`SELECT DATE(rh_rpt_create_dt_time) AS x, COUNT(*) AS y 
    FROM reporting_history where rh_rpt_status=100 AND rh_rpt_create_dt_time 
    BETWEEN '${req.query.st_dt}' AND '${req.query.end_dt}'
    GROUP BY DATE(rh_rpt_create_dt_time) `);

    let result2 =
      await query(`SELECT DATE(rh_rpt_create_dt_time) AS x, COUNT(*) AS y 
    FROM reporting_history where rh_rpt_status=-100 AND rh_rpt_create_dt_time 
    BETWEEN '${req.query.st_dt}' AND '${req.query.end_dt}'
    GROUP BY DATE(rh_rpt_create_dt_time) `);

    if (result.code || result2.code) {
      logger.error("[dateWiseScdRpt][error]", result.code || result2.code);

      return res.status(400).json({
        success: false,
        message: "Invalid Query/Data!",
      });
    }
    result = _.difference(result, ["meta"]);
    for (let r of result) {
      const d = new Date(r.x);
      const x = moment(d).format("YYYY-MM-DD");
      r.x = x;
    }

    result2 = _.difference(result2, ["meta"]);
    for (let r of result2) {
      const d = new Date(r.x);
      const x = moment(d).format("YYYY-MM-DD");
      r.x = x;
    }

    logger.info("[dateWiseScdRpt][response]", {
      success: true,
      data: {
        success: result,
        failed: result2,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        success: result,
        failed: result2,
      },
    });
  } catch (error) {
    logger.error("[dateWiseScdRpt][error]", error);

    res.status(500).send({ success: false, error: error });
  }
};

exports.reportWiseScd = async (req, res) => {
  try {
    logger.info("[reportWiseScd][controller]");

    const rpt = `SELECT crm_rpt_code FROM configure_reports_mst WHERE crm_rpt_status=100`;
    const scd = `SELECT scd_rpt_code FROM scheduled_reports WHERE scd_rpt_status=100 GROUP BY scd_rpt_code`;

    let result1 = await query(rpt);
    let result2 = await query(scd);
    result1 = _.difference(result1, ["meta"]);
    result2 = _.difference(result2, ["meta"]);

    if (result1.code || result2.code) {
      logger.error("[reportWiseScd][error]", result1.code || result2.code);

      return res.status(400).json({
        success: false,
        message: "Invalid Query/Data!",
      });
    }
    final = result1.filter(
      (u) =>
        result2.findIndex((lu) => lu.scd_rpt_code === u.crm_rpt_code) === -1
    );

    console.log("asdsad", final);
    let scheduled = result2.length;
    let unScheduled = final.length;

    logger.info("[reportWiseScd][response]", {
      success: true,
      data: {
        scheduled: scheduled,
        unScheduled: unScheduled,
      },
    });
    res.status(200).json({
      success: true,
      data: {
        scheduled: scheduled,
        unScheduled: unScheduled,
      },
    });
  } catch (error) {
    logger.error("[reportWiseScd][error]", error);

    res.status(500).send({ success: false, error: error });
  }
};
