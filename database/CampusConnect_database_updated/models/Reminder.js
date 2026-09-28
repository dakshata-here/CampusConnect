const mongoose=require("mongoose");
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},eventId:{type:mongoose.Schema.Types.ObjectId,ref:"Event",required:true,index:true},reminderType:{type:String,enum:["1_DAY","6_HOURS","1_HOUR","30_MINUTES"],required:true},scheduledFor:{type:Date,required:true},sentAt:{type:Date,default:null},isSent:{type:Boolean,default:false}},{timestamps:true});
schema.index({userId:1,eventId:1,reminderType:1},{unique:true}); module.exports=mongoose.model("Reminder",schema);
