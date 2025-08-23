const { pool } = require("../config/db");

const getInternalUserId = async (clerkId) => {
  if (!clerkId) return null;
  const result = await pool.query("SELECT id FROM users WHERE clerk_id = $1", [
    clerkId,
  ]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

module.exports = {
  getInternalUserId,
};
