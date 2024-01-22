const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
    paymentId: String,
    createTime: String,
    state: String,
    total: String,
    currency: String,
    itemName: String,
    itemQuantity: Number,
    description: String,
    payerEmail: String,
    payerFirstName: String,
    payerLastName: String
});

module.exports = mongoose.model('Receipt', ReceiptSchema);
