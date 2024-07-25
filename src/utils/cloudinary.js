import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.cloudinary_cloud_name, 
    api_key:    process.env.cloudinary_api_key, 
    api_secret: process.env.cloudinary_api_secret,
});

const cloudinaryUpload = async (localfile) => {
    try {
        const uploadResult = await cloudinary.uploader
        .upload(
            localfile, {
                resource_type: 'auto',
            }
        )
        console.log(uploadResult);
        return uploadResult;    
        
    } catch (error) {
        fs.unlinkSync(localfile);
        return null;
    }

}
export { cloudinaryUpload };