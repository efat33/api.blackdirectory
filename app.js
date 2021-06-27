const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const morgan = require('morgan');
const compression = require('compression');


const globalErrorHandler = require('./controllers/error-controller');

const userRouter = require('./routes/users-routes');
const listingRouter = require('./routes/listing-routes');
const uploadRouter = require('./routes/upload-routes');
const jobRouter = require('./routes/jobs-routes');

const app = express();

// enabling cors for all requests by using cors middleware
app.use(cors({
  credentials: true, origin: 'http://localhost:4200', optionsSuccessStatus: 200, 
  methods: "POST, GET, PUT", 
  // allowedHeaders: 'X-Api-Key, Content-Type, Authorization, Accept, multipart/form-data'
}));

// Enable pre-flight
app.options("*", cors());

// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cookieParser());
app.use(compression());

// make images inside uploads folder accessible from browser url
app.use(express.static(__dirname + '/uploads'));

app.use('/users', userRouter);
app.use('/listings', listingRouter);
app.use('/upload', uploadRouter);
app.use('/jobs', jobRouter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Blackdirectory!!!" });
});

app.use(globalErrorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}...`);
});
