require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors());


app.use('/', require('./src/routes'));

const port = process.env.PORT || 8080;

app.listen(port, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('connect server ' + port);
    }
})