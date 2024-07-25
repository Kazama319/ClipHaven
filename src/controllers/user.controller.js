import {asyncHandler} from  "../utils/asynchandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/Apierror.js"
import {ApiResponse} from "../utils/apiresponse.js"
import { cloudinaryUpload } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
        throw new ApiError(409, "User already existed");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    console.log("Avatar path:", avatarLocalPath);
    if (coverImageLocalPath) {
        console.log("Cover image path:", coverImageLocalPath);
    }

    const avatar = await cloudinaryUpload(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await cloudinaryUpload(coverImageLocalPath) : { url: "" };

    if (!avatar) {
        throw new ApiError(400, "Avatar image upload failed");
    }

    const user = await User.create({
        fullname,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const tokengenerator=async (userid)=>{
   try {
     const user= await User.findById(userid);
     const accesstoken=user.generateaccesstoken();
     const refreshtoken=user.generaterefreshtoken();
     user.refreshtoken=refreshtoken;
     await user.save({validateBeforeSave:false});
     return {accesstoken,refreshtoken};
   } catch (error) {
    throw new ApiError(500,"Token generation failed");
    
   }
    

}
const loginUser=asyncHandler( async(req,res)=>{
    const {username,email,password}= req.body;
    console.log(email);
    console.log(password);
    console.log(username);
    if(!username && !email){
        throw new ApiError(400,"provide all the fields");
    }
    
    const user=await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(400,"user not found");
    }
    const passcheck=await user.passchecker(password);
    if(!passcheck)throw new  ApiError(409,"Password Invalid");

    const {accesstoken,refreshtoken}= await tokengenerator(user._id);
    const loggedinuser=await User.findById(user._id).select("-password -refreshtoken"); 

    const options={
        secure:true,
        httpOnly:true,
    }
    return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new ApiResponse(200,{loggedinuser,accesstoken, refreshtoken},"User logged in successfully")
    )


})
const logoutUser=asyncHandler(async(req,res)=>{
    const user=req.user;
    const loggoutuser=await User.findById(user._id);
    user.refreshtoken=undefined;
    await user.save({validateBeforeSave:false});
    const Option={
        secure:true,
        httpOnly:true
    }
    return res.status(200).
    clearCookie("accesstoken",Option)
    .clearCookie("refreshtoken",Option)
    .json(
        new ApiResponse(200,{},"User Logged out successfully")
    )
})

const refreshtoken=asyncHandler(async(req,res)=>{
    const usertoken=req.cookie.refreshtoken || req.body.refreshtoken;
    console.log(usertoken);
    if(!usertoken)throw new ApiError( 401,"Token not found");
    const decodetoken=jwt.verify(usertoken,process.env.refresh_token_secret);
    if(!decodetoken)throw new ApiError (401,"Invalid token");
    const user=await User.findById(decodetoken.id);
    if(!user)throw new ApiError( 401,"User not found");
    if(usertoken!==user.refreshtoken)   throw new ApiError(401,"unauthorized request");
    const {accesstoken,newrefreshtoken}=await tokengenerator(user._id);
    const loggedinuser=await User.findById(user._id).select("-password -refreshtoken");
    const options={
        secure:true,
        httpOnly:true
    }
    return res.status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken=newrefreshtoken,options)
    .json(
        new ApiResponse(200,{loggedinuser,accesstoken,newrefreshtoken},"Token refreshed successfully")
    )



}
)
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})
export {registerUser,loginUser,logoutUser,refreshtoken, getCurrentUser, changeCurrentPassword,
     updateAccountDetails, updateUserAvatar, updateUserCoverImage}
