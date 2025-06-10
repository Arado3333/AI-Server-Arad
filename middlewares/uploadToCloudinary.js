import { v2 as cloudinary } from "cloudinary";

export async function uploadToCloudinary(req, res, next) {
    console.log("Uploading to cloudinary...");
    
    // Configuration - cloudinary
    cloudinary.config({
        cloud_name: "df0kbj0km",
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    let file = req.body.file;
    let result;

    if (!file) {
        return res.status(400).json("No file provided");
    }

    // Upload an image
    try {
        result = await cloudinary.uploader.upload(file, {
            upload_preset: "shenkar2025",
        });
        next();
        // res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json("Error uploading image");
    }
}
