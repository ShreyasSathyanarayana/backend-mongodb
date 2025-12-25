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


// import the routes
import UserRoute from './routes/user.route.js'


// add the routes in middleware
app.use('/api/v1/users', UserRoute)



export {app}