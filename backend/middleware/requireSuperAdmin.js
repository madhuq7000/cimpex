const { isSuperAdminUser } = require("../utils/superAdmin");

const requireSuperAdmin = (req, res, next) => {
  if (!isSuperAdminUser(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Only the admin can manage categories",
    });
  }

  next();
};

module.exports = requireSuperAdmin;
