
const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  try {
    // Read the Authorization header
    const authHeader = req.headers.authorization;

    // Check whether token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    // Extract token after "Bearer "
    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Attach authenticated user's ID to request
    req.userId = decoded.userId;

    // Continue to the requested route
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Not authorized. Invalid or expired token."
    });
  }
}

module.exports = protect;
