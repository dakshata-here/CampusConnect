const mongoose = require("mongoose");
const clubSchema = new mongoose.Schema({
  name:{type:String,required:true,unique:true,trim:true}, shortName:{type:String,required:true,unique:true,trim:true},
  description:{type:String,default:""}, logoUrl:{type:String,default:""}, bannerUrl:{type:String,default:""},
  departmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Department",default:null},
  category:{type:String,enum:["TECHNICAL","CULTURAL","SPORTS","ENTREPRENEURSHIP","OTHER"],default:"OTHER"},
  status:{type:String,enum:["ACTIVE","INACTIVE"],default:"ACTIVE"},
  socialLinks:{website:String,instagram:String,linkedin:String,youtube:String,other:String}
},{timestamps:true});
module.exports=mongoose.model("Club",clubSchema);
