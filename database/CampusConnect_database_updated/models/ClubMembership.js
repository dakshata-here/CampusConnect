const mongoose=require("mongoose");
const schema=new mongoose.Schema({
  clubId:{type:mongoose.Schema.Types.ObjectId,ref:"Club",required:true,index:true},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  role:{type:String,enum:["LEAD","MEMBER"],default:"MEMBER",required:true},
  designation:{type:String,default:"",trim:true}, joinedAt:{type:Date,default:Date.now}, isActive:{type:Boolean,default:true}
},{timestamps:true});
schema.index({clubId:1,userId:1},{unique:true});
module.exports=mongoose.model("ClubMembership",schema);
