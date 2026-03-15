// hashAdminPassword.js
const pool = require("./config/db"); // make sure db.js exists
const bcrypt = require("bcrypt");

async function hashAdminPassword() {
  const password = "admin123"; // the password you want for admin
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    "UPDATE admins SET password=$1 WHERE username='admin'",
    [hash]
  );

  console.log("Admin password hashed!");
  process.exit();
}

hashAdminPassword().catch(err => console.error(err));