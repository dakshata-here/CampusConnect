const mongoose=require("mongoose");
const schema=new mongoose.Schema({eventId:{type:mongoose.Schema.Types.ObjectId,ref:"Event",required:true,index:true},studentId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},rating:{type:Number,required:true,min:1,max:5},usefulnessRating:{type:Number,min:1,max:5},organizationRating:{type:Number,min:1,max:5},comments:{type:String,default:""},suggestions:{type:String,default:""}},{timestamps:true});
schema.index({eventId:1,studentId:1},{unique:true}); module.exports=mongoose.model("EventFeedback",schema);
