module.exports = (router, controller) => {
  router.get("/getReportDetails/:id", controller.getReportDetails);
};
