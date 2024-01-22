const mongoose = require('mongoose');

const savedPurchaseSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    date_and_time: {
        type: Date,
        required: true
    }
});

const savedPurchase = mongoose.model('savedPurchase', savedPurchaseSchema);

module.exports = savedPurchase;
