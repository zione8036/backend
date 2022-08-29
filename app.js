//Imports
require('dotenv/config');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const api = process.env.API_URL;
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const authJwt = require('./middleware/jwt');
const errorHandler = require('./middleware/error-handler');

//CORS
app.use(cors());
app.options('*', cors());

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

//Routers
app.use(`${api}/products`, productsRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);

//DB Connections
mongoose
    .connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log('Database connected');
    })
    .catch((err) => {
        console.log(err);
    });

app.listen(3000, () => {
    console.log('Server is running!');
});
