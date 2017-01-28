var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var User = require('../schemas/user.js');
var Review = require('../schemas/review.js');

/* GET home page. */

router.get('/login', function(req, res, next){
    
    res.render('login');
    
});

router.post('/login', passport.authenticate('local-login', {failureRedirect:'/login', successRedirect:'/search'}));

router.get('/', function(req, res, next) {
	res.render('homepage'); 
}); 


router.get('/settings', function(req, res, next){
	res.render('settings'); 
    
});

router.post('/settings', function(request, response, next) {

	if (request.body.id == "ethnicity") {
		User.findOne({_id:request.user._id}, function(err, user){
		if(err){
			throw err;
		}
		else {
			response.send({data: user});
		}

		});
	}
	else if (request.body.id == "buttoninput"){
		User.findOne({_id: request.user._id}, function(err, person) {
		if (err) {
			throw err; 
		}
		if (person) {
			person.gender = request.body.gender; 
			person.age = request.body.age; 
			person.ethnicity = request.body.ethnicity; 
			person.location.state = request.body.state; 
			person.location.city = request.body.city; 
			person.dietaryRestrictions.vegetarian = request.body.vegetarian;
			person.dietaryRestrictions.vegan = request.body.vegan; 
			person.dietaryRestrictions.kosher = request.body.kosher; 
			person.dietaryRestrictions.halal = request.body.halal; 
			person.dietaryRestrictions.nutAllergies = request.body.nutAllergies; 
 			person.save(function(err) {
				if (err) {
					console.log(err); 
				}
				else{
					console.log(person); 
					response.send({data: person});

				}
 
			});


		}
		
	}); 
	}
}); 

router.get('/signup', function(req, res, next){
	res.render('signup');
});

router.post('/signup', function(req, res, next){
	console.log('got to post');
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;
	console.log(username);

	// find if user already exists by checking username and email
	// if already exists some error message
	// if not, add user to database and sign in
	User.findOne({username:username}, function(err, user){
		console.log('got here');
		if(err){
			console.log(err);
			return res.send({message:"error please try again"});
		}
		if(user){
			console.log(user);
			return res.send({message:"username exists"});
		
		}
		var newUser = new User();
		newUser.username = username;
		newUser.password = newUser.generateHash(password);
		newUser.name = name;
		newUser.save(function(err){
			if(err){
				console.log(err);
				return res.send({message:"error cannot save please try again"});
			}
			else{
				return res.send({redirect:'/login'});
			}
			});
		
	});

});

router.get('/auth/google', passport.authenticate('google', {scope:['profile email']}));

router.get('/auth/google/callback', 
	passport.authenticate('google', {
		failureRedirect:'/login'
	}), function(req,res){
		res.redirect('/settings');

});

router.get('/reviews', function(req, res, next){
	console.log(req.user);
	Review.find({'author._id':req.user._id}, function(err, reviews){
		if(err){
			console.log(err);
			res.render('reviews', {hasReviews: false, message:"There was an error loading your reviews"});
		}
		else if(reviews){
			console.log(reviews);
			res.render('reviews', {hasReviews: true, reviews:reviews});
		}
		else{
			console.log("no reviews");
			res.render('reviews', {hasReviews: false, message:'You have not made any reviews yet.'});
		}

	});
	
});
router.post('/reviews', function(req, res, next){
	if(req.body.action=='create'){
		var review = {
			restaurant: req.body.restaurant,
			cuisine: req.body.cuisine,
			rating: req.body.rating,
			author: req.user,
			content: req.body.content,
			location:{city:req.body.city, state:req.body.state}
		};
		Review.create(review, function(err, review){
			if(err){
				return res.send({message:err});
			}
			if(review){
				return res.send({newReview:review});
			}
			return res.send({message:"unknown error"});
		});
	}
	if(req.body.action=='delete'){
		Review.remove({_id: req.body.id}, function(err){
			if(err){
				console.log(err);
				res.send({wasDeleted: false, message:"There was an error deleting this review"});
			}
			else{
				res.send({wasDeleted: true, message:"successfully deleted"});
			}
		});

	}

});
router.get('/search', function(req, res, next){
	res.render('search');

});

router.post('/search', function(req, res, next){
	console.log('got to post');
	Review.find({restaurant: {
        $regex: req.body.name,
         $options: "i"
    }}, function(err, reviews) {
    	if (err) {
    		console.log(err);
    		throw err; 
    	}
    	if(reviews){
    		console.log(reviews);
    		res.send({
    		data: reviews
    		});

    	}
    	
 
    }); 
});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/login');
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

module.exports = router;
