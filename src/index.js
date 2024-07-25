import dotenv from "dotenv"
import connectDB from "./db/index.js";
import  {app} from "./app.js"
dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.port,()=>{
        console.log(`Server is running at port ${process.env.port}` );

    })
})
.catch((error)=>{
    console.log("Connection Failed Mongo DB");
    throw error
})