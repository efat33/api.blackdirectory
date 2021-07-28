const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const morgan = require('morgan');
const compression = require('compression');

const globalErrorHandler = require('./controllers/error-controller');

const userRouter = require('./routes/users-routes');
const listingRouter = require('./routes/listing-routes');
const uploadRouter = require('./routes/upload-routes');
const jobRouter = require('./routes/jobs-routes');
const newsRouter = require('./routes/news-routes');
const mailRouter = require('./routes/mail-routes');

const app = express();

// enabling cors for all requests by using cors middleware
app.use(cors({
    credentials: true, origin: 'http://localhost:4200', optionsSuccessStatus: 200,
    methods: "POST, GET, PUT, DELETE",
    // allowedHeaders: 'X-Api-Key, Content-Type, Authorization, Accept, multipart/form-data'
}));

// Enable pre-flight
app.options("*", cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(cookieParser());
app.use(compression());

// make images inside uploads folder accessible from browser url
app.use(express.static(__dirname + '/uploads'));

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/jobs/stripe-webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use('/users', userRouter);
app.use('/listings', listingRouter);
app.use('/upload', uploadRouter);
app.use('/jobs', jobRouter);
app.use('/news', newsRouter);
app.use('/mail', mailRouter);

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Blackdirectory!!!" });
});

app.use(globalErrorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Running on port ${port}...`);
});
