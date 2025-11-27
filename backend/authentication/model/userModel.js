const authPool = require("../authDb");

exports.findByUsernameOrEmail = async (username, email) => {
  return authPool.query(
    "SELECT * FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );
};
