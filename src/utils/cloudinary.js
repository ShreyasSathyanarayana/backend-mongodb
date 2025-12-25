import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath){
            return null
        }
        // upload file on cloudinary
        const result = await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        });
        
        // file uploaded successfully
        console.log('File is uploaded on cloudinary : ',result.url)
        return result
    }
    catch(error){
        fs.unlink(localFilePath) // remove the locally saved temporary file  as upload operation got failed
        return null
    }
}

export { uploadOnCloudinary };