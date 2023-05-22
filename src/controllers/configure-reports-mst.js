const {
    query,
    connection,
    queryRollBack,
    readOnlyQuery,
} = require("../config/sqlDatabase");
const { compareKeys } = require("../utils/helpers");
// const moduleName = "[configure-reports-mst]",
//   logger = require(`${__utils}/logger/logger`)(moduleName);
const moduleName = "[configure-reports-mst]",
    logger = require(`${__utils}/logger/logger`)(moduleName);
exports.getReports = async(req, res, next) => {
    try {
        logger.info("[getReports][controller]");

        let result = await query(
            `SELECT * FROM configure_reports_mst WHERE crm_rpt_status=100;`
        );

        if (result.code) {
            logger.error("[getReports][error]", result);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }
        logger.info("[getReports][response]", { success: true, data: result });
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("[getReports][error]", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.addReport = async(req, res, next) => {
    try {
        logger.info("[addReport][body]", req.body);

        var expectedKeys = ["desc", "title", "sql_query"];
        const allKeys = Object.keys(req.body);
        const isLength = await compareKeys(expectedKeys, allKeys, res);
        if (isLength > 0) {
            return res
                .status(203)
                .json({ success: false, message: "Keys are required" });
        }
        const { desc, title, sql_query } = req.body;
        let code = Math.random().toString(36).substr(2, 6);
        let result = await query(
            `INSERT INTO configure_reports_mst (crm_rpt_code, crm_rpt_desc, crm_rpt_title, crm_rpt_sql, crm_rpt_created_by) VALUES ('${code}', '${desc}', '${title}', "${sql_query}", '${req.headers.enduser}');`
        );

        if (result.code) {
            logger.error("[addReport][error]", result);
            return res.json({
                success: false,
                message: "Sorry could't insert the details",
            });
        }

        logger.info("[addReport][response]", {
            success: true,
            message: "Successfully Added the report details",
            data: result,
        });

        res.status(200).json({
            success: true,
            message: "Successfully Added the report details",
        });
    } catch (error) {
        logger.error("[addReport][error]", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteReport = async(req, res, next) => {
    try {
        logger.info("[deleteReport][params]", req.params);

        const { id } = req.params;
        const mstRes = await query(
            `UPDATE configure_reports_mst SET crm_rpt_status=-100 WHERE crm_rpt_code='${id}';`
        );
        if (mstRes.code) {
            logger.error("[deleteReport][error]", mstRes);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }
        logger.info("[deleteReport][response]", {
            success: true,
            data: mstRes,
        });
        res.json({ success: true, data: mstRes });
    } catch (error) {
        logger.error("[deleteReport][error]", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateReport = async(req, res, next) => {
    try {
        logger.info("[updateReport][body]", req.body);

        const { desc, title } = req.body;
        if (!req.params.id && !desc && !title) {
            return res.status(203).json({ success: false, message: "Invalid Data!" });
        }
        let result = await query(
            `UPDATE configure_reports_mst SET crm_rpt_desc='${desc}', crm_rpt_title='${title}' WHERE crm_id=${req.params.id}  `
        );
        if (result.code) {
            logger.error("[updateReport][error]", result);
            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }
        logger.info("[updateReport][response]", {
            success: true,
            data: result,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("[updateReport][error]", error);

        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getReportQueryData = async(req, res, next) => {
    try {
        logger.info("[getReportQueryData][body]", req.body);
        if (!Object.keys(req.body).includes("query")) {
            return res
                .status(203)
                .json({ success: false, message: "Invalid Request Data" });
        }

        if (req.body.is_valid) {
            let concatQuery = req.body.query + " LIMIT 10";

            let readOnly = await readOnlyQuery(`${concatQuery}`);

            if (readOnly.code) {
                logger.error("[getReportQueryData][error]", readOnly);

                return res
                    .status(400)
                    .json({ success: false, message: "Sorry your query is not valid" });
            }

            return res.status(200).json({ success: true, data: readOnly });
        } else {
            result = await query(`${req.body.query}`);

            if (result.code) {
                logger.error("[getReportQueryData][error]", readOnly);

                return res
                    .status(400)
                    .json({ success: false, message: "Sorry your query is not valid" });
            }

            let keys = Object.keys(result[0]);

            let data = [];
            let count = 1;
            for (let key in keys) {
                data.push({
                    column_name: keys[key],
                    column_type: result.meta[key].type,
                    column_header: keys[key],
                    is_checked: 1,
                    position: count,
                });
                count += 1;
            }

            let tempArr = [];
            for (let val of result) {
                let obj = {};
                obj.column_name = val.COLUMN_NAME;
                obj.column_type = val.DATA_TYPE;
                obj.column_header = val.COLUMN_NAME;
                obj.is_checked = 0;
                obj.position = val.ORDINAL_POSITION;
                tempArr.push(obj);
            }
            logger.info("[getReportQueryData][response]", {
                success: true,
                data: data,
            });

            res.status(200).json({ success: true, data: data });
        }
    } catch (error) {
        logger.error("[getReportQueryData][error]", error);

        res.status(500).json({ success: false, error: error.message });
    }
};