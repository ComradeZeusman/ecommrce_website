const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    product_id:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    currency:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true,
    },
    quantity:{
        type: Number,
        required: true
    },
    
    image:{
        type: String,
        required: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

module.exports = mongoose.model('Product', productSchema)