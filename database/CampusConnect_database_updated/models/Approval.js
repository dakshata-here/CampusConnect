const mongoose=require("mongoose");
const schema=new mongoose.Schema({eventId:{type:mongoose.Schema.Types.ObjectId,ref:"Event",required:true,index:true},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},action:{type:String,enum:["APPROVED","REJECTED","CHANGES_REQUESTED","OVERRIDDEN"],required:true},comments:{type:String,default:""},reviewedAt:{type:Date,default:Date.now}},{timestamps:true});
module.exports=mongoose.model("Approval",schema);
