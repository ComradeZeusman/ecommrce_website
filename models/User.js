const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    reg_id:{
        type: String,
        required: true
    },
    full_name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    usertype:{
        type: String,
        required: true
    },
    continent:{
        type: String,
        required: true
    },
    currentRates:{
        type: String,
        required: true
    },
    currencyPlural:{
        type: String,
        required: true
    },
    currency:{
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    countryCode:{
        type: String,
        required: true
    },
    countryPhone:{
        type: String,
        required: true
    },approval_Status:{
        default: 'Pending',
        type: String,
        required: true
    },
})

module.exports = mongoose.model('User', userSchema)
    