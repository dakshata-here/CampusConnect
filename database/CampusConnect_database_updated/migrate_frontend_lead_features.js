require("dotenv").config();
const connectDB = require("./config/db");
const ClubLeadTask = require("./models/ClubLeadTask");
const ClubLeadMessage = require("./models/ClubLeadMessage");

async function migrate() {
  await connectDB();

  await ClubLeadTask.createIndexes();
  await ClubLeadMessage.createIndexes();

  console.log("CampusConnect lead chat/task database update completed.");
  console.log("- ClubLeadTask.eventId is available for optional event linking.");
  console.log("- ClubLeadMessage.eventId is available for optional event tagging.");
  console.log("- Existing tasks and messages were preserved.");

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
