const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  fullName:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  userType:{type:String,enum:["STUDENT","FACULTY","ADMIN"],required:true},
  prn:{type:String,unique:true,sparse:true,trim:true},
  employeeId:{type:String,unique:true,sparse:true,trim:true},
  departmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Department",default:null},
  year:{type:String,default:""}, semester:{type:String,default:""}, profilePhotoUrl:{type:String,default:""},
  isActive:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model("User",userSchema);
