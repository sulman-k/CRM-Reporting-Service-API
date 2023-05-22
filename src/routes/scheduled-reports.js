module.exports = (router, controller) => {
    router.post("/addSchedule", controller.addSchedule);
    router.get("/getSchedules", controller.getSchedules);
    router.delete("/deleteSchedule/:id", controller.deleteSchedule);
    router.put("/updateSchedule/:id", controller.updateSchedule);
    router.get("/downloadReport/:id", controller.downloadScheduledReport);
    router.get("/getScheduleReportHistory/:id", controller.getSchedulesReportsHistory);
};