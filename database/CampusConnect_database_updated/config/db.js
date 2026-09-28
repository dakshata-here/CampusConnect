const mongoose=require("mongoose");
async function connectDB(){
 const uri=process.env.MONGODB_URI;
 if(!uri) throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env.");
 try{await mongoose.connect(uri);console.log("MongoDB Atlas connected.");}
 catch(error){console.error("MongoDB connection failed:",error.message);process.exit(1);}
}
module.exports=connectDB;
