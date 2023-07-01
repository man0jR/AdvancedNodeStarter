const { clearCache } = require("../services/caching");

module.exports = async (req, res, next) => {
  await next();
  console.log("clearing cache for the user");
  clearCache(req.user.id);
};
