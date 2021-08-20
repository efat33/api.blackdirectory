const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require("cors");
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const globalErrorHandler = require('./controllers/error-controller');

const userRouter = require('./routes/users-routes');
const listingRouter = require('./routes/listing-routes');
const uploadRouter = require('./routes/upload-routes');
const jobRouter = require('./routes/jobs-routes');
const newsRouter = require('./routes/news-routes');
const mailRouter = require('./routes/mail-routes');
const shopRouter = require('./routes/shop-routes');
const eventRouter = require('./routes/event-routes');
const mobilesRouter = require('./routes/mobiles-routes');
const stripeRouter = require('./routes/stripe-routes');

const StripeController = require('./controllers/stripe-controller');
const awaitHandlerFactory = require('./utils/awaitHandlerFactory');

const app = express();

// enabling cors for all requests by using cors middleware
app.use(cors({
    credentials: true, origin: ['http://localhost:4200', 'http://localhost:4200/', 'https://localhost:4200'], optionsSuccessStatus: 200,
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
// app.use(express.static(__dirname + '/uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/stripe/stripe-webhook') {
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
app.use('/shop', shopRouter);
app.use('/events', eventRouter);
app.use('/mobiles', mobilesRouter);
app.use('/stripe', stripeRouter);

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Blackdirectory!!!" });
});

app.use(globalErrorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Running on port ${port}...`);
});
