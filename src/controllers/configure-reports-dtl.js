const { query } = require("../config/sqlDatabase");
const moduleName = "[configure-reports-dtl]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getReportDetails = async (req, res, next) => {
  try {
    logger.info("[getReportDetails][params]", req.params);

    let id = req.params.id;
    let result = await query(
      `select * from configure_reports_dtl where crd_scd_id='${id}';`
    );
    if (result.code) {
      logger.error("[getReportDetails][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getReportDetails][response]", {
      success: true,
      data: result,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error("[getReportDetails][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
