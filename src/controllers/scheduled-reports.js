const { query } = require("../config/sqlDatabase");
const { compareKeys } = require("../utils/helpers");
const moduleName = "[scheduled-reports]",
    logger = require(`${__utils}/logger/logger`)(moduleName);
const _ = require("lodash");
const fs = require("fs");
exports.getSchedules = async(req, res) => {
    try {
        logger.info("[getSchedules][controller]");

        let result = await query(
            `SELECT * FROM scheduled_reports WHERE scd_rpt_status=100 order by scd_id desc;`
        );

        if (result.code) {
            logger.error("[getSchedules][error]", result);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }

        for (let res of result) {
            let email2 = await getEmails(res.scd_id, res);
            Object.assign(res, { emails: email2 });
        }

        logger.info("[getSchedules][response]", {
            success: true,
            data: result,
        });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("[getSchedules][error]", error);

        res.status(500).json({ success: false, error: error.message });
    }
};

exports.addSchedule = async(req, res, next) => {
    try {
        logger.info("[addSchedule][body]", req.body);

        const expectedKey = [
            "title",
            "description",
            "interval",
            "dispatch_type",
            "export_type",
            "report_code",
            "schedule_details",
            "emails",
            "scd_rpt_start_dt",
        ];
        const has_keys = Object.keys(req.body).includes(req.body);
        const isLength = compareKeys(expectedKey, has_keys);
        if (isLength > 0) {
            return res.status(203).json({ success: false, message: "Invalid Data" });
        }
        const {
            interval,
            dispatch_type,
            export_type,
            report_code,
            schedule_details,
            title,
            description,
            emails,
            scd_rpt_start_dt,
        } = req.body;
        let result = await query(
            `INSERT INTO scheduled_reports 
      (scd_rpt_title, scd_rpt_desc, scd_rpt_interval, scd_rpt_dispatch_type, scd_rpt_export_type, scd_rpt_code,scd_rpt_last_print,scd_rpt_start_dt, scd_rpt_created_by ) 
      VALUES ('${title}','${description}','${interval}', '${dispatch_type}', '${export_type}', '${report_code}', '${scd_rpt_start_dt}','${scd_rpt_start_dt}', '${req.headers.enduser}');`
        );
        if (result.code) {
            logger.error("[addSchedule][error]", result);

            return res.status(400)({
                success: false,
                message: "Invalid Query/Data!",
            });
        }

        if (emails.length > 0) {
            await addEmails(result.insertId, emails, res);
        }
        if (schedule_details.length == 0)
            return res.json({
                success: true,
                message: "Added into schedule while details are empty",
            });
        let user = req.headers.enduser;
        await addScheduleDetails(result.insertId, schedule_details, res, user);

        logger.info("[addSchedule][response]", {
            success: true,
            message: "Successfully added the record",
        });
        res.json({ success: true, message: "Successfully added the record" });
    } catch (error) {
        logger.error("[addSchedule][error]", error);

        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteSchedule = async(req, res, next) => {
    try {
        logger.info("[deleteSchedule][params]", req.params);

        const { id } = req.params;
        let result = await query(
            `UPDATE scheduled_reports SET scd_rpt_status='-100' WHERE scd_id=${id}  `
        );
        let result2 = await query(
            `UPDATE configure_reports_dtl SET crd_column_status='-100' WHERE crd_scd_id=${id}  `
        );
        if (result.code || result2.code) {
            logger.error("[deleteSchedule][error]", result.code || result2.code);

            return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
        }
        logger.info("[deleteSchedule][response]", {
            success: true,
            data: result,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("[deleteSchedule][error]", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSchedule = async(req, res, next) => {
    try {
        logger.info("[updateSchedule][body]", req.body);
        logger.info("[updateSchedule][params]", req.params);

        let id = req.params.id;
        const expectedKey = [
            "title",
            "description",
            "interval",
            "dispatch_type",
            "export_type",
            "report_code",
            "schedule_details",
            "emails",
            "scd_rpt_start_dt",
        ];
        const has_keys = Object.keys(req.body).includes(req.body);
        const isLength = compareKeys(expectedKey, has_keys);
        if (isLength > 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }
        const {
            interval,
            dispatch_type,
            export_type,
            report_code,
            schedule_details,
            title,
            description,
            emails,
            scd_rpt_start_dt,
        } = req.body;

        let result = await query(
            `UPDATE scheduled_reports 
            SET scd_rpt_interval='${interval}', 
            scd_rpt_code='${report_code}',
            scd_rpt_title='${title}',
            scd_rpt_desc='${description}',
            scd_rpt_dispatch_type='${dispatch_type}', 
            scd_rpt_export_type='${export_type}', 
            scd_rpt_start_dt='${scd_rpt_start_dt}', 
            scd_rpt_last_print='${scd_rpt_start_dt}' 
            WHERE scd_id=${id} `
        );
        if (result.code) {
            logger.error("[updateSchedule][error]", result);

            return res.status(400)({
                success: false,
                message: "Invalid Query/Data!",
            });
        }
        if (emails.length > 0) {
            await query(`delete from dispatch_type where dispatch_scd_id=${id};`);
            await addEmails(id, emails, res);
        }

        await updateScheduleDetails(id, schedule_details, res);
        logger.info("[updateSchedule][response]", {
            success: true,
            data: result,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error("[updateSchedule][error]", error);

        res.status(500).json({ success: false, error: error.message });
    }
};

async function addScheduleDetails(code, data, res, user) {
    try {
        console.log("dat", data);
        for (let obj of data) {
            await query(
                `INSERT INTO configure_reports_dtl (crd_seq_no, crd_column_name, crd_column_type, crd_header_text, crd_column_show, crd_scd_id ,crd_created_by) 
        VALUES ('${obj.position}', '${obj.column_name}', '${obj.column_type}', '${obj.column_header}', '${obj.is_checked}', '${code}', '${user}');`
            );
        }

        return;
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, msg: "here" });
    }
}

async function addEmails(id, data, res) {
    try {
        console.log("dat", data);
        for (let obj of data) {
            await query(
                `INSERT INTO dispatch_type (email, dispatch_scd_id) values ('${obj.email}', ${id});`
            );
            console.log(
                `INSERT INTO dispatch_type (email, dispatch_scd_id) values ('${obj.email}', ${id});`
            );
        }

        return;
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, msg: "here" });
    }
}

async function getEmails(id, res) {
    try {
        let result = await query(
            `select * from dispatch_type where dispatch_scd_id=${id};`
        );
        return result;
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, msg: "here" });
    }
}

async function updateScheduleDetails(code, data, res) {
    try {
        console.log("dat", data);
        for (let obj of data) {
            if (obj.column_header) {
                await query(
                    `UPDATE configure_reports_dtl SET crd_header_text='${obj.column_header}', crd_column_show='${obj.crd_column_show}' WHERE crd_id=${obj.crd_id};`
                );
            } else {
                await query(
                    `UPDATE configure_reports_dtl SET crd_header_text='${obj.crd_header_text}', crd_column_show='${obj.crd_column_show}' WHERE crd_id=${obj.crd_id};`
                );
            }
        }
        return;
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, msg: "here" });
    }
}

exports.updateSchedule = async(req, res, next) => {
    try {
        let id = req.params.id;
        const expectedKey = [
            "title",
            "description",
            "interval",
            "dispatch_type",
            "export_type",
            "report_code",
            "schedule_details",
            "emails",
            "scd_rpt_start_dt",
        ];
        const has_keys = Object.keys(req.body).includes(req.body);
        const isLength = compareKeys(expectedKey, has_keys);
        if (isLength > 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }
        const {
            interval,
            dispatch_type,
            export_type,
            report_code,
            schedule_details,
            title,
            description,
            emails,
            scd_rpt_start_dt,
        } = req.body;

        let result = await query(
            `UPDATE scheduled_reports SET scd_rpt_interval='${interval}', scd_rpt_code='${report_code}',scd_rpt_title='${title}',
        scd_rpt_desc='${description}',
        scd_rpt_dispatch_type='${dispatch_type}', scd_rpt_export_type='${export_type}', scd_rpt_start_dt='${scd_rpt_start_dt}' WHERE scd_id=${id}  `
        );
        console.log(result);

        if (emails.length > 0) {
            await query(`delete from dispatch_type where dispatch_scd_id=${id};`);
            await addEmails(id, emails, res);
        }

        if (result.code) {
            return res.json({
                success: false,
                message: "Sorry could not Insert the record",
            });
        }

        await updateScheduleDetails(id, schedule_details, res);

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
module.exports.downloadScheduledReport = async(req, res) => {
    try {
        const id = req.params.id;
        let result = await query(`Select rh_file_name from reporting_history where id = ${id}`);
        result = _.difference(result, "meta");
        if (!result[0].rh_file_name) return res.status(403).json({ success: false, error: "Filename not exist" });
        const fileName = result[0].rh_file_name;
        res.download(`${__root}/public/${process.env.REPORT_DIRECTORY_NAME}/${fileName}`, `${fileName}`, (err) => {
            if (err) {
                res.json({ success: false, error: "Directory or file not exist" })
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports.getSchedulesReportsHistory = async(req, res) => {
    try {
        const id = req.params.id;
        let result = await query(`SELECT * FROM reporting_history WHERE rh_rpt_scd_id = ${id}`);
        if (result.code) {
            return res.json({ success: false, message: result.text });
        }
        result = _.difference(result, "meta");
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}