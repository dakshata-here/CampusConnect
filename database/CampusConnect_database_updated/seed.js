require("dotenv").config();
const connectDB=require("./config/db");
const Department=require("./models/Department");
const Venue=require("./models/Venue");
const SystemSettings=require("./models/SystemSettings");
async function seed(){
 await connectDB();
 await Department.deleteMany({}); await Venue.deleteMany({}); await SystemSettings.deleteMany({});
 await Department.insertMany([
  {name:"Computer Engineering"},{name:"Electronics & Telecommunication Engineering"},{name:"Information Technology"},{name:"Artificial Intelligence & Data Science"}
 ]);
 await Venue.insertMany([
  {name:"Main Auditorium",building:"A-Block",floor:"Ground Floor",capacity:800,facilities:["Projector","AC","Sound System"]},
  {name:"Central Seminar Hall",building:"F-Block",floor:"Ground Floor",capacity:300,facilities:["Projector","AC","Sound System"]},
  {name:"Advanced Computing Lab 1",building:"C-Block",floor:"1st Floor",capacity:90,facilities:["Computers","Projector","AC"]},
  {name:"AI & Data Science Lab 2",building:"C-Block",floor:"2nd Floor",capacity:80,facilities:["Computers","Projector","AC"]},
  {name:"Smart Classroom 301",building:"C-Block",floor:"3rd Floor",capacity:120,facilities:["Interactive Smart Board","Projector","AC"]},
  {name:"Lecture Hall 302",building:"C-Block",floor:"3rd Floor",capacity:120,facilities:["Projector","AC"]},
  {name:"College Open Amphitheatre & Ground",building:"Campus Ground",floor:"Open Area",capacity:2500,facilities:["Open Stage","Sound System","Lighting"]}
 ]);
 await SystemSettings.create({academicYear:"2026-2027",semester:"Semester 1 (Odd Term)",proposalPermissions:{clubLeadsCanPropose:true,requireAdminApproval:true},maintenanceMode:false});
 console.log("CampusConnect seed data inserted."); process.exit(0);
}
seed().catch(err=>{console.error(err);process.exit(1);});
