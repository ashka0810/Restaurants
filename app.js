/*********************************************************************************
 * ITE5315 – Project *
 * I declare that this assignment is my own work in accordance with Humber Academic Policy. *
 *  No part of this assignment has been copied manually or electronically from any other source * 
 * (including web sites) or distributed to other students. *
 * Group member Name: Ashka Shah, Rushil Patel 
 * Student IDs:  Date: ____________________ *
* ********************************************************************************/

var express = require('express');
var mongoose = require('mongoose');
var app = express();
var database = require('./Config/Database');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
var bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const verifytoken=require('./Authentication');

require('dotenv').config();

var path = require('path');//include path module using require method
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

var port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ 'extended': 'true' }));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

app.engine('.hbs', expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars), extname: '.hbs'
}));
app.set('view engine', '.hbs');

DATABASE_USER = process.env.DATABASE_USER;
DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;

var Restaurant = require('./Models/Restaurants');

const restaurantDb = new Restaurant("mongodb+srv://"+DATABASE_USER+":"+DATABASE_PASSWORD+"@march8.nqo96.mongodb.net/sample_restaurants");

    restaurantDb.initialize().then(()=>{
        //     app.listen(port, ()=>{
        //     console.log('Connected To Database....')
        //     console.log(`App listening on: localhost:${port}`);
        // });
    }).catch((err)=>{
        console.log(err);
    });

// route that sends the welcome message as a response 
app.get('/', function (req, res, next) {
    res.send("Welcome to Restaurants Project")
});

app.post('/login', (req,res)=>{
	console.log(req.body)
	//Authenticated User
	const username = req.body.username
	const user = { name : username }
	const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN)
	res.json({ accessToken : accessToken})
})



// route to get all restaurant data from database
app.get('/api/restaurants', verifytoken,async function (req, res) {
    restaurantDb.getAllRestaurantData().then(function (err, restaurants) {
        // checks if there is any error retrieving the data and sends if found any
        if (err)
            res.send(err)
        // return all restaurant data in JSON format
        res.json(restaurants); 
    });
});

// search restaurant by id
app.get('/api/restaurants/:restaurant_id', verifytoken,async function (req, res) {
    let id = req.params.restaurant_id;

    restaurantDb.getRestaurantById(id).then(function (err, restaurant) {
        // checks for any error which searching
        if (err)
            res.send(err)
        // return all restaurant data in JSON format
        res.json(restaurant);
    });
});

// create a new restaurant data and then return all the reastaurant data
app.post('/api/restaurants', verifytoken,async function (req, res) {

    var data = {
        _id: mongoose.Types.ObjectId(req.body._id),
		restaurant_id: req.body.restaurant_id,
        name: req.body.name,
        cuisine: req.body.cuisine,
        borough: req.body.borough
    }

	// create a new record into collection
	restaurantDb.addrestaurant(data).then(function (err, restaurant) {
		if (err)
			res.send(err);

		// get and return all the restaurant data after newly created restaurant record
		restaurantDb.getrestaurant().then(function (err, restaurants) {
			if (err)
				res.send(err)
			return res.json(restaurants);
		});
	});
});


// update the data by using id
app.put('/api/restaurants/:restaurant_id', verifytoken,async function (req, res) {
    // update an existing record into collection
    let id = req.params._id;
    const data = {
        restaurant_id: req.body.restaurant_id,
        name: req.body.name,
        cuisine: req.body.cuisine,
        borough: req.body.borough
    }

    // save the user
    restaurantDb.updateRestaurant(data, id).then(function (err, restaurant) {
        if (err) throw err;

        res.send('Successfully! Restaurant updated - ' + id);
    });
});

// delete the record using id
app.delete('/api/restaurants/:restaurant_id', verifytoken,async function (req, res) {
    let id = req.params.restaurant_id;
    restaurantDb.deleteRestaurant(id).then(function (err) {
        if (err)
            res.send(err);
        else
            res.send('Successfully! Restaurant has been Deleted.');
    });
});

//get all restaurant data from db
app.get('/data', verifytoken,async function (req, res) {

    const borough = req.query.borough;
    Restaurant.find({borough:borough},function (err, restaurants) {
        if (err)
            res.send(err)
        const page = req.query.page;
        const perpage = req.query.perpage;
        const starting = (page - 1) * perpage;
        const ending = page * perpage;
        const result = restaurants.slice(starting, ending);
        res.json(result); // return all restaurants in JSON format
    });
});

//add new restaurant
app.get('/api/search', (req, res, next) => {
	res.render('search', { layout: false });
});

//search based on page, perpage and borough
app.post('/api/search', (req, res, next) => {
	const borough = req.body.borough;
    const page = req.body.page;
    const perpage = req.body.perpage;
    console.log(Restaurant);
    // Restaurant.find({borough:borough},function (err, restaurants) {
    //     // if there is an error retrieving, send the error otherwise send data
    //     if (err)
    //         res.send(err)
    //     const starting = (page - 1) * perpage;
    //     const ending = page * perpage;
    //     const result = restaurants.slice(starting, ending);
    //     res.render('display', { data: result, layout: false }); // return all restaurant in JSON format
    // });
    restaurantDb.getrestaurant(page,perpage,borough).then(function (err, restaurants) {
        if (err)
            res.send(err)
        return res.render('display', { data: restaurants, layout: false }); // return all restaurant in JSON format
    });

    app.get("*",function(req,res){
        res.send('404 page not found');
    });
});

app.listen(port);