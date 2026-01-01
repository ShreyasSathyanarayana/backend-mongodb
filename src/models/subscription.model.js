import mongoose from "mongoose";


const subscriptionSchema = new mongoose.Schema({
    channel:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{
    timestamps: true
})


export const Subscription = mongoose.model("Subscription", subscriptionSchema);