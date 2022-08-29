const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const { default: mongoose } = require('mongoose');
const router = express.Router();
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });

//Display all and if have a query display by categories
router.get(`/`, async (req, res) => {
    let filter = {};

    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }
    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false, message: 'No data found' });
    }
    res.status(200).send(productList);
});

//Find by ID
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
        res.status(500).json({ message: 'No product found' });
    }
    res.status(200).send(product);
});

//Add
router.post('/', uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).send('Invalid Category');
    }
    const file = req.file;
    if (!file) {
        return res.status(400).send('No image in the request');
    }

    const photoPath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    const fileName = req.file.filename;
    let product = new Product({
        name: req.body.name,
        short_description: req.body.short_description,
        long_description: req.body.long_description,
        brand: req.body.brand,
        category: req.body.category,
        image: `${photoPath}${fileName}`,
        price: req.body.price,
        rating: req.body.rating,
        numberOfReviews: req.body.numberOfReviews,
        isFeatured: req.body.isFeatured,
        isHotDeals: req.body.isHotDeals,
        discounts: req.body.discounts,
        countInStock: req.body.countInStock,
        dateCreated: req.body.dateCreated,
    });
    product = await product.save();
    if (!product) {
        return res.status(500).send('Product cannot be add!');
    }
    res.send(product);
});

//Update the product by id
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
    } else {
        imagepath = product.image;
    }
    const productUpdate = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            short_description: req.body.short_description,
            long_description: req.body.long_description,
            brand: req.body.brand,
            category: req.body.category,
            image: imagepath,
            price: req.body.price,
            rating: req.body.rating,
            numberOfReviews: req.body.numberOfReviews,
            isFeatured: req.body.isFeatured,
            isHotDeals: req.body.isHotDeals,
            discounts: req.body.discounts,
            countInStock: req.body.countInStock,
            dateCreated: req.body.dateCreated,
        },
        { new: true }
    );

    res.send(productUpdate);
});

//Remove the product by id
router.delete('/:id', async (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                res.status(200).json({
                    success: true,
                    message: 'The product is deleted successfully',
                });
            } else {
                return res.status(404).json.json({
                    success: false,
                    message: 'Failed to delete',
                });
            }
        })
        .catch((err) => {
            return res.status(400).json({
                success: false,
                error: err,
            });
        });
});

//Count all the products posted
router.get(`/get/count`, async (req, res) => {
    const countProduct = await Product.countDocuments();
    if (!countProduct) {
        res.status(500).json({ success: false });
    }
    res.send({ 'Number of products': countProduct });
});

//Get all the featured but with limitation
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredProduct = await Product.find({ isFeatured: true })
        .select('name price image rating')
        .limit(+count);
    if (!featuredProduct) {
        res.status(500).json({ success: false });
    }
    res.send(featuredProduct);
});

//Get all the featured
router.get(`/get/featured`, async (req, res) => {
    const featuredProduct = await Product.find({ isFeatured: true }).select(
        'name price image rating'
    );
    if (!featuredProduct) {
        res.status(500).json({ success: false });
    }
    res.send({ 'Featured products': featuredProduct });
});

//Get all the hot deals but with limitation
router.get(`/get/hotdeal/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const hotDealProduct = await Product.find({ isHotDeals: true })
        .select('name price image rating')
        .limit(+count);
    if (!hotDealProduct) {
        res.status(500).json({ success: false });
    }
    res.send(hotDealProduct);
});

//Get all the hot deals
router.get(`/get/hotdeal`, async (req, res) => {
    const hotDealProduct = await Product.find({ isHotDeals: true }).select(
        'name price image rating'
    );
    if (!hotDealProduct) {
        res.status(500).json({ success: false });
    }
    res.send({ 'Hot deal products': hotDealProduct });
});

//Updating the gallery pictures
router.put(
    '/gallery/:id',
    uploadOptions.array('gallery', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get(
            'host'
        )}/public/uploads/gallery-uploads/`;

        if (files) {
            files.map((file) => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                gallery: imagesPaths,
            },
            { new: true }
        );

        if (!product)
            return res.status(500).send('The gallery cannot be updated!');

        res.send(product);
    }
);

module.exports = router;
