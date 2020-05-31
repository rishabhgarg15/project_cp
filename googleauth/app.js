const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const authRoutes = require('./routes/authroutes');
const profileRoutes = require('./routes/profileroutes');
const passportSetup = require('./configure/passportsetup');
const mongoose = require('mongoose');
const keys = require('./configure/keys');
const FileName = require('./models/filename');
const fs = require('fs');
const methodOverride=require("method-override");
const bodyParser=require("body-parser");
const flash=require("connect-flash");


//Express-FileUpload is library used to upload files.
const	expressUpload=require("express-fileupload");



const app = express();


app.use(expressUpload());
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:"true"}));
app.use(flash());

// set view engine
app.set('view engine', 'ejs');

app.use(express.static(__dirname+'/upload'));

// set up session cookies
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});
// connect to mongodb
mongoose.connect(keys.mongodb.dbURI,{ useNewUrlParser: true ,useCreateIndex: true, useUnifiedTopology: true}).then(function(){
																								console.log("connected to database");
																								}).catch(function(err){
																									console.log("Error:",err.message)
																							});


// set up routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// create home route
app.get('/', (req, res) => {
    res.render('home', { user: req.user });
});



//Middle Ware
const authCheck = (req, res, next) => {
    if(!req.user){
    	req.flash("error","You Must be logged in first!");
        res.redirect('/auth/login');
    } else {
        next();
    }
};



app.get('/upload', authCheck, (req, res) => {
    res.render('upload',{ user: req.user });
});



app.post("/upload",authCheck,function(req,res){
	if(req.files){
		var file=req.files.filename,
			name=file.name;



			FileName.findOne({fname: name}, function(err,fl){
				if(fl!==null){
					res.send("Already present a file with this name.")
				}else {

						FileName.create({fname:name},function(err,filename){
								if(err){
									console.log(err);
								}else {
									console.log(filename);	
								}
						});

							file.mv("./upload/"+name,function(err){
						if(err){
							console.log(err);
							res.send("Something went wrong");
						}else{
							res.render("uploadsuccessfull",{user: req.user});

						}

			});
				}
			});

			

	}else{
		res.send("Cannot upload your file!");
	}
		
});




app.get("/download",function(req,res){

	FileName.find({},function(err,files){
		if(err)
		{
			res.send("Error in Displaying files.");
		}else {

			res.render("download",{user: req.user,files:files});
		}
	});

});	




app.delete("/delete/:id/:name",function(req,res){
	//find and delete file


const path = './upload/'+req.params.name;


fs.unlink(path, (err) => {
  if (err) {
    console.error(err)
    throw err;
  }else {

  	FileName.findByIdAndDelete(req.params.id,function(err){
		if(err){
			res.redirect("/");
		}else{
			console.log("Deleted File");
			res.redirect("/");
		}
	});
	
}
	
});

});



app.listen(3000, () => {
    console.log('app now listening for requests on port 3000');
});




