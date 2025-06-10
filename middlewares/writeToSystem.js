import fs from "fs"; // Importing the library
import path from "path";

export async function writeToSystem(req, res, next) { //filePath, base64String

    const filePath = req.body.writeTo; 
    const base64String = req.body.file;

    try {
      // Remove the data URI prefix if present
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      try {
        await fs.promises.access(directory);
      } catch (error) {
        await fs.promises.mkdir(directory, { recursive: true });
      }
      
      // Write the file
      await fs.promises.writeFile(filePath, buffer);
      console.log(`Image created successfully at ${filePath}`);
      next();
    } catch (error) {
      console.error(`Error writing image file: ${error.message}`);
      next(error);
    }
  }
