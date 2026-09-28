const mongoose=require("mongoose");
const schema=new mongoose.Schema({eventId:{type:mongoose.Schema.Types.ObjectId,ref:"Event",required:true,index:true},sentBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},subject:{type:String,required:true,trim:true},message:{type:String,required:true},recipientCount:{type:Number,default:0,min:0},recipientUserIds:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],sentAt:{type:Date,default:Date.now}},{timestamps:true});
module.exports=mongoose.model("EventBroadcastEmail",schema);
