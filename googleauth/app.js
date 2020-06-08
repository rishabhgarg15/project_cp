const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const authRoutes = require('./routes/authroutes');
const profileRoutes = require('./routes/profileroutes');
const passportSetup = require('./configure/passportsetup');
const mongoose = require('mongoose');
const keys = require('./configure/keys');
const FileName = require('./models/filename');
const VideoLink = require('./models/videolink');
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

app.use("/upload",express.static(__dirname+'/upload'));
app.use("/public",express.static(__dirname+'/public'));

// set up session cookies
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next){
    res.locals.user=req.user;
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
    res.render('home');
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

const verifyAdmin=function(req,res,next){
 if(req.user.admin)
     {
     next();
     }
    else
        {
         req.flash("error","You are not allowed to do this operation!");
             res.redirect('/');
        }
};



const getIdOfYoutubeLink = function (url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11)
      ? match[2]
      : null;
}

app.use('/upload',authCheck,verifyAdmin);
app.use('/delete',authCheck,verifyAdmin);
app.use('/addVideo',authCheck,verifyAdmin);

app.get('/upload', (req, res) => {
    res.render('upload');
});



app.post("/upload",function(req,res){
	if(req.files){
		var file=req.files.filename,
			name=file.name;

		var field = req.body.field_val;


			FileName.findOne({fname: name}, function(err,fl){
				if(fl!==null){
					res.send("Already present a file with this name.")
				}else {


							var lastDot = name.lastIndexOf('.');

 						 	var  onlyname = name.substring(0, lastDot);

						FileName.create({fname:name,fieldname:field,name: onlyname},function(err,filename){
								if(err){
									console.log(err);
									res.send("Something went wrong try again to upload!");
								}else {
									console.log(filename);

								}
						});

							file.mv("./upload/"+name,function(err){
						if(err){
							console.log(err);
							FileName.remove({fname:name},function(err){
								if(err){
									console.log(err);
									}else {
										console.log(name+ " Removed from database as file cannot be uploaded");
									}
							});

							res.send("Something went wrong");



						}else{
							res.render("uploadsuccessfull");

						}

			});
				}
			});

			

	}else{
		res.send("Cannot upload your file!");
	}
		
});

app.get('/addVideo', (req, res) => {
    res.render('addVideo');
});

app.post('/addVideo', (req, res) => {
    var vlink=req.body.videolink;
    var field=req.body.field_val;
    var nametoshow=req.body.showname;


    var videoId = getIdOfYoutubeLink(vlink);
    var vlinkfinal='http://www.youtube.com/embed/'+videoId;

    VideoLink.findOne({vLink:vlinkfinal}, function(err,link){
				if(link!==null){
					res.send("Already present a link with this name !")
				}else {

						VideoLink.create({vLink:vlinkfinal,fieldname:field,name:nametoshow},function(err,link){
								if(err){
									console.log(err);
									res.send("Something went wrong try again to ADD link later!");
								}else {
									console.log(link);
									res.redirect("/");
								}
						});
					}
				});		

});



// app.get("/download",function(req,res){

// 	FileName.find({},function(err,files){
// 		if(err)
// 		{
// 			res.send("Error in Displaying files.");
// 		}else {

// 			res.render("download",{user: req.user,files:files});
// 		}
// 	});

// });	



app.get("/resources",function(req,res){
	res.render("resources",{user: req.user});
});	


app.get("/resources/:cid/notes",function(req,res){
	var field = req.params.cid;
	console.log(field);
	FileName.find({fieldname:field},function(err,files){
		if(err){
			res.send("Something went wrong");
		}else {
			// console.log(files);
			res.render("notes",{files:files});	
		}	
	});
	
});

app.get("/resources/:cid/videos",function(req,res){
		var field = req.params.cid;
		VideoLink.find({fieldname:field},function(err,videos){
		if(err){
			res.send("Something went wrong");
		}else {
			// console.log(videos);
			res.render("videos",{videos:videos});	
		}	
	});


		
});



//Delete Notes File
app.delete("/delete/notes/:id/:name",function(req,res){
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






//Delete Youtube Video
app.delete("/delete/video/:id",function(req,res){
		VideoLink.findByIdAndDelete(req.params.id,function(err){
		if(err){
			res.redirect("/");
		}else{
			console.log("Removed Youtube Video");
			res.redirect("/");
		}
	});
});


app.listen(3000, () => {
    console.log('app now listening for requests on port 3000');
});




