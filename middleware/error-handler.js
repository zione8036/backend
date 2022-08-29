

function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        //Login errors
       return res.status(500).json({ message: 'You need to login first!' });
    }
    if (err.name === 'ValidationError') {
        //For files errors
        return res.status(500).json({ message: err });
    }
        //Default errors
        return res.status(500).json(err);
}


module.exports = errorHandler;