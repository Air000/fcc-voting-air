'use strict';

var VottingPoll = require("../app/models/votingPoll");

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        VottingPoll.find(function(err, polls) {
            if(err) res.send("database error!");
            
            res.render('pages/index.ejs', {user: req.user, polls: polls}); // load the index.ejs file
            
        });
        
    });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('pages/login.ejs', { message: req.flash('loginMessage') }); 
    });
    
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('pages/profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });
    
    app.get('/loginuserhome', isLoggedIn, function(req, res) {
        res.render('pages/loginuserhome.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });
    
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/',
            failureRedirect : '/'
        }));
        
    // =====================================
    // NEWPOLL ==============================
    // =====================================
    // show the newpoll form
    app.get('/newpoll', isLoggedIn, function(req, res) {
    
        // render the page and pass in any flash data if it exists
        res.render('pages/newpoll.ejs', { 
            message: req.flash('newpollMessage'),
            user: req.user
        });
    });

    // process the newpoll form
    app.post('/newpoll', isLoggedIn, function(req, res) {
        //console.log(req.user);
        
        var newPoll = new VottingPoll();
        newPoll.createdByUser = req.user.twitter.username;
        newPoll.topic = req.body.topic;
        
        req.body.options.split(";").forEach(function(item) {
            newPoll.optionList.push({optionName: item, votingNum: 0});
        });
        
        //save to database
        newPoll.save(function(err, ret) {
           if(err)
                throw err;
            
            res.redirect('/votingfor/' + ret._id);    
        });
        
    });
    
    app.get('/votingfor/*', function(req, res) {
        VottingPoll.findOne({ _id: req.url.split('/')[2] }, function(err, poll) {
            res.render('pages/voting.ejs', {
                user: req.user,
                poll: poll
            });
        });
        
    });
    
    app.get('/mypolls', isLoggedIn, function(req, res) {
        VottingPoll.find({createdByUser: req.user.twitter.username}, function(err, polls) {
            res.render('pages/index.ejs', {
                user: req.user,
                polls: polls
            });
        });
        
    });
    // process the voteforpoll form
    app.post('/voteforpoll', function(req, res) {
        console.log('req.body', req.body);
        VottingPoll.findOne({_id: req.body.pollId, 'optionList.votedUsers': req.user? req.user.twitter.username : getClientIP(req)}, function(err, isfound) {
            
            if (isfound) {
                console.log('only can vote once');
                res.status(400);
                res.send('Only can vote once!');
            
                
            } else {
                if(req.body.optionsRadios !== 'custom')
                {
                    console.log(req.user);
                    VottingPoll.findOneAndUpdate (
                    { _id: req.body.pollId, 'optionList.optionName': req.body.optionsRadios }, 
                    { $push: { 'optionList.$.votedUsers' :  req.user?req.user.twitter.username:getClientIP(req)}}, 
                
                    function(err,result){
                        if (!err) {
                            //console.log(result);
                            
                        }
                    });
                } else {    //optionRadios == 'custom'
                    if(req.user) {
                        VottingPoll.findOneAndUpdate (
                        { _id: req.body.pollId }, 
                        { $push: { optionList: {optionName: req.body.customOption, votedUsers: [req.user.twitter.username]}}}, 
                        function(err, result) {
                            if(!err) console.log(result);
                        });
                    }
                }
                res.send('Thank you for voting!');
            }
        });
        
        
        
    });
    
    app.post('/deletepoll', isLoggedIn, function(req, res) {
        VottingPoll.remove({ _id: req.body.pollId }, function(err, result) {
            
            //render mypolls
            VottingPoll.find({createdByUser: req.user.twitter.username}, function(err, polls) {
                res.render('pages/index.ejs', {
                    user: req.user,
                    polls: polls
                });
            });
            
        });
        
    });
    
    app.get('/chart', function(req, res) {
        res.render('partials/chart.ejs', {});
    });
};

function getClientIP(req) {
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
     //console.log(ip);
     return ip;
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}