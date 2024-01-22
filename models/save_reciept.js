const mongoose = require('mongoose');

const saveRecieptSchema = new mongoose.Schema({
 name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    product_name:{
        type: String,
        required: true
    },
    product_quantity:{
        type: Number,
        required: true
    },
    product_price:{
        type: Number,
        required: true,
    },
    quantity:{
        type: Number,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    total:{
        type: Number,
        required: true
    },
    reciept_id:{
        type: String,
        required: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})
 
module.exports = mongoose.model('SaveReciept', saveRecieptSchema)