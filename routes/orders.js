const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

router.get(`/`, async (req, res) => {
    let userFilter = {};
    let statusFilter = {};
    if (req.query.users) {
        userFilter = { user: req.query.users };
        statusFilter = { status: 0 };
    }

    const orderList = await Order?.find(userFilter)
        ?.find(statusFilter)
        .populate('user orderItems', 'name quantity product')
        .sort('dateOrdered');

    if (!orderList) {
        res.status(500).json({ success: false });
    }
    res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: { path: 'product', populate: 'category' },
        })
        .sort('dateOrdered');

    if (!order) {
        res.status(500).json({ success: false });
    }
    res.send(order);
});

//Add
router.post('/', async (req, res) => {
    const orderItemsIds = Promise.all(
        req.body.orderItems.map(async (orderitem) => {
            let newOrderItem = new OrderItem({
                quantity: orderitem.quantity,
                product: orderitem.product,
            });

            newOrderItem = await newOrderItem.save();

            return newOrderItem._id;
        })
    );

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(
        orderItemsIdsResolved.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate(
                'product',
                'price'
            );

            const totalPrice = orderItem.product.price * orderItem.quantity;

            return totalPrice;
        })
    );

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    console.log(totalPrices);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress: req.body.shippingAddress,
        shippingAddress1: req.body.shippingAddress1,
        barangay: req.body.barangay,
        city: req.body.city,
        zip: req.body.zip,
        region: req.body.region,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
        dateOrdered: req.body.dateOrdered,
    });
    order = await order.save();

    if (!order) return res.status(400).send('the order cannot be created!');

    res.status(200).send(order);
});

//Update the status order
router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        { new: true }
    );
    if (!order) {
        return res.status(404).send('Order cannot be update!');
    }
    res.send(order);
});

//Removing the order by id
router.delete('/:id', async (req, res) => {
    Order.findByIdAndRemove(req.params.id)
        .then(async (order) => {
            if (order) {
                await order.orderItems.map(async (orderItem) => {
                    await OrderItem.findByIdAndRemove(orderItem);
                });
                res.status(200).json({
                    success: true,
                    message: 'The order is deleted successfully',
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

//Get the total sales
router.get('/get/sales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
    ]);

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }

    res.send({ Sales: totalSales.pop().totalsales });
});

//Count all the products posted
router.get(`/get/count`, async (req, res) => {
    const countOrder = await Order.countDocuments();
    if (!countOrder) {
        res.status(500).json({ success: false });
    }
    res.send({ 'Number of orders': countOrder });
});

//Order history by the user
router.get(`/get/user/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid })
        .populate({
            path: 'orderItems',
            populate: { path: 'product', populate: 'category' },
        })
        .sort('dateOrdered');

    if (!userOrderList) {
        res.status(500).json({ success: false });
    }
    res.send(userOrderList);
});

module.exports = router;
