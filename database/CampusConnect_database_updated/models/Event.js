const mongoose=require("mongoose");
const rescheduleSchema=new mongoose.Schema({
 oldDate:Date,oldStartTime:String,oldEndTime:String,oldVenueId:{type:mongoose.Schema.Types.ObjectId,ref:"Venue"},
 newDate:Date,newStartTime:String,newEndTime:String,newVenueId:{type:mongoose.Schema.Types.ObjectId,ref:"Venue"},reason:String,
 changedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},changedAt:{type:Date,default:Date.now}
},{_id:false});
const schema=new mongoose.Schema({
 title:{type:String,required:true,trim:true}, eventType:{type:String,required:true,trim:true}, category:{type:String,enum:["CLUB","ACADEMIC"],required:true},
 shortDescription:{type:String,default:""},description:{type:String,default:""},agenda:{type:String,default:""},posterTheme:{type:String,default:""},posterUrl:{type:String,default:""},
 date:{type:Date,required:true},startTime:{type:String,required:true},endTime:{type:String,required:true},
 venueId:{type:mongoose.Schema.Types.ObjectId,ref:"Venue",default:null},clubId:{type:mongoose.Schema.Types.ObjectId,ref:"Club",default:null},
 proposedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},maxParticipants:{type:Number,default:null,min:1},registrationRequired:{type:Boolean,default:false},
 registrationMethod:{type:String,enum:["CAMPUSCONNECT","EXTERNAL","NONE"],default:"CAMPUSCONNECT"},externalRegistrationUrl:{type:String,default:""},externalRegistrationQrUrl:{type:String,default:""},registrationDeadline:{type:Date,default:null},
 eligibility:{type:String,default:""},requiredMaterials:{type:String,default:""},contactPerson:{type:String,default:""},contactEmail:{type:String,default:""},contactPhone:{type:String,default:""},
 status:{type:String,enum:["DRAFT","PENDING_APPROVAL","CHANGES_REQUESTED","APPROVED","REJECTED","RESCHEDULED","CANCELLED","COMPLETED"],default:"DRAFT"},
 rejectionReason:{type:String,default:""},changeComments:{type:String,default:""},rescheduledHistory:{type:[rescheduleSchema],default:[]}
},{timestamps:true});
schema.index({venueId:1,date:1,startTime:1,endTime:1}); schema.index({clubId:1,status:1}); schema.index({category:1,date:1});
module.exports=mongoose.model("Event",schema);
