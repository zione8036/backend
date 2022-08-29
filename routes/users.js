const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//Display All
router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
        res.status(500).json({ success: false });
    }
    res.send(userList);
});




//Display by ID
router.get(`/:id`, async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
        res.status(500).json({ message: 'No user found' });
    }
    res.status(200).send(user);
});

//Create a user
router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        street: req.body.street,
        apartment: req.body.apartment,
        barangay: req.body.barangay,
        city: req.body.city,
        zip: req.body.zip,
        region: req.body.region,
        isAdmin: req.body.isAdmin,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
    });
    user = await user.save();
    if (!user) {
        return res.status(404).send('User cannot be add!');
    }
    res.send(user);
});

//Update user
router.put('/:id', async (req, res) => {
    const userUpdate = await User.findById(req.params.id);
    let newpassword = '';
    if (req.body.password) {
        newpassword = bcrypt.hashSync(req.body.password, 10);
    } else {
        newpassword = userUpdate.passwordHash;
    }
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            street: req.body.street,
            apartment: req.body.apartment,
            barangay: req.body.barangay,
            city: req.body.city,
            zip: req.body.zip,
            region: req.body.region,
            isAdmin: req.body.isAdmin,
            passwordHash: newpassword,
        },
        { new: true }
    );
    if (!user) {
        return res.status(404).send('User cannot be update!');
    }
    res.send(user);
});

//Login method
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('Invalid email or password');
    }
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
            },
            secret,
            { expiresIn: '1d' }
        );
        res.status(200).send({ email: user.email, token: token });
    } else {
        res.status(400).send('Invalid email or password');
    }

    return res.status(200).send(user);
});

//Create a user
router.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        street: req.body.street,
        apartment: req.body.apartment,
        barangay: req.body.barangay,
        city: req.body.city,
        zip: req.body.zip,
        region: req.body.region,
        isAdmin: req.body.isAdmin,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
    });
    user = await user.save();
    if (!user) {
        return res.status(404).send('User cannot be created!');
    }
    res.send(user);
});

//Count all the registered users
router.get(`/get/count`, async (req, res) => {
    const countUser = await User.countDocuments();
    if (!countUser) {
        res.status(500).json({ success: false });
    }
    res.send({ 'Number of users': countUser });
});

//Remove the user by id
router.delete('/:id', async (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then((user) => {
            if (user) {
                res.status(200).json({
                    success: true,
                    message: 'The user is deleted successfully',
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

module.exports = router;
