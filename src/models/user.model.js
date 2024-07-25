import mongoose, { Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema({

    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,

    },
    password:{
        type:String,
        required:[true,"pas id req"],


    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,  

    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchhistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    refreshtoken:{
        type:String,

    },
    
    
    
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next();
    }
    this.password=await bcrypt.hash(this.password,10);
    next();
})
userSchema.methods.passchecker=async function(password){
    return await bcrypt.compare(password,this.password);

}
userSchema.methods.generateaccesstoken = function() { 
    return jwt.sign({
        id: this._id,
        username: this.username,
        email: this.email,
        fullname: this.fullname,
        avatar: this.avatar,
        coverImage: this.coverImage,
    },
    process.env.access_token_secret,
    {expiresIn: process.env.access_token_expiry}
    );
}   
userSchema.methods.generaterefreshtoken=  function(){
    return jwt.sign({
     id:this._id,
     
    },
     process.env.refresh_token_secret,
     {expiresIn:process.env.refresh_token_expiry}
 )
 
 
 }
 export const User = mongoose.model("User", userSchema)
