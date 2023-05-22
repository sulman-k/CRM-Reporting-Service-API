module.exports = (router, controller) => {
  router.get("/dateWiseScdRpt", controller.dateWiseScdRpt);
  router.get("/reportWiseScd", controller.reportWiseScd);
};
