import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

// handles cors related issues
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential:true
}))



// in order to encode the url encoded  (hint: extended is used for nested objects)
app.use(express.urlencoded({extended: true, limit: '16kb'}))


// in order to use req.body 
app.use(express.json({
    limit: '16kb'
}))

// in order to perform crud operation on cookies
app.use(cookieParser())

// in order to store a files in the server
app.use(express.static('public'))



export {app}