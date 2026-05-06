const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const target = path.join(root, ".env.local");
const example = path.join(root, ".env.example");

if (fs.existsSync(target)) {
  console.log(".env.local כבר קיים — לא שיניתי כלום. רק מלאי את המפתחות.");
  process.exit(0);
}
if (!fs.existsSync(example)) {
  console.error("חסר .env.example");
  process.exit(1);
}
fs.copyFileSync(example, target);
console.log("נוצר .env.local מ-.env.example");
console.log("פתחי את הקובץ והדביקי מ-Supabase → Settings → API את ה-URL וה-anon key.");
