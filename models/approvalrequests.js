const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email:{
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    },
    date_and_time:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema)