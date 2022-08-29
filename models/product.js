const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    short_description: {
        type: String,
        required: true,
    },
    long_description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    gallery: [
        {
            type: String,
        },
    ],
    brand: {
        type: String,
    },
    price: {
        type: Number,
        default: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 1000,
    },
    rating: {
        type: Number,
        default: 0,
    },
    numberOfReviews: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isHotDeals: {
        type: Boolean,
        default: false,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    discounts: {
        type: Number,
        default: 0,
    },
});

productSchema.virtual('id').get(function(){
    return this._id.toHexString();
})
productSchema.set('toJSON',{
    virtuals:true,
})

exports.Product = mongoose.model('Product', productSchema);
