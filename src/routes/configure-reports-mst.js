module.exports = (router, controller) => {
  router.post("/addReport", controller.addReport);
  router.get("/getReports", controller.getReports);
  router.delete("/deleteReport/:id", controller.deleteReport);
  router.put("/updateReport/:id", controller.updateReport);
  router.post("/getReportQueryData", controller.getReportQueryData);
};
