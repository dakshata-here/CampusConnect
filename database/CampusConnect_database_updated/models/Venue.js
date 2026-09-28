const mongoose=require("mongoose");
const schema=new mongoose.Schema({
 name:{type:String,required:true,unique:true,trim:true}, building:{type:String,required:true,trim:true}, floor:{type:String,default:""}, capacity:{type:Number,required:true,min:1},
 facilities:{type:[String],default:[]}, isAvailable:{type:Boolean,default:true}, operationalStatus:{type:String,enum:["OPERATIONAL","MAINTENANCE","UNAVAILABLE"],default:"OPERATIONAL"}
},{timestamps:true});
module.exports=mongoose.model("Venue",schema);
