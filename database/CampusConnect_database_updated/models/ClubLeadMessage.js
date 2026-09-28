const mongoose=require("mongoose");
const schema=new mongoose.Schema({clubId:{type:mongoose.Schema.Types.ObjectId,ref:"Club",required:true,index:true},senderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},message:{type:String,required:true,trim:true}},{timestamps:true});
module.exports=mongoose.model("ClubLeadMessage",schema);
