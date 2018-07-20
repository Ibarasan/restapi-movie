const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const request = require("request");


//APP CONFIG
mongoose.connect("mongodb://localhost:27017/moviedatabaseREST", { useNewUrlParser: true });
// mongoose.connect("mongodb://restmovie1:restmovie1@ds143971.mlab.com:43971/moviedatabase", { useNewUrlParser: true });
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({extended: true}));


//MODEL CONFIG
const commentSchema = new mongoose.Schema({
   text: String,
});
const Comment = mongoose.model("Comment", commentSchema);

const movieSchema = new mongoose.Schema({
    title: { type: String, unique: true },
    imdbID: String, 
    comments: [commentSchema]
});
const Movie = mongoose.model("Movie", movieSchema);

app.get("/movies", (req, res) => {

    Movie.find({}, function(err, movies) {
        if(err) {
            console.log(err);
        } else {
            res.render("movies", {movies: movies});
        }
    });
});

// ROUTES

app.get("/", (req, res) => {
   res.redirect("/movies"); 
});

app.post("/movies", (req, res) => {
    const search = req.body.movie;
    const url = `http://www.omdbapi.com/?t=${search}&apikey=5265b8a0`;


    request(url, function(error, response, body) {
    if(!error && response.statusCode == 200) {
        let data = JSON.parse(body);

        if(data.Title == null) {
            console.log("Movie not exist on OMDB");
            res.redirect("/movies");
        } else {
            Movie.create({title: data.Title, imdbID: data.imdbID}, (err, newMovie) => {
                if(err) {
                    console.log("Movie already exist in database!");
                    res.redirect("/movies");
                } else {
                    res.redirect("/movies");
                }
            });
            
        }
    }
    });
});

app.post("/comments", (req, res) => {
   const movieID = req.body.movieTitle;
   const commentText = req.body.commentText;
   
    Movie.findOne({title: movieID}, (err, movie) => {
       if(err) {
           console.log(err);
           res.redirect("/comments");
       } else if(movie != null) {
            movie.comments.push({
            text: commentText 
           });
           movie.save((err, movie) => {
               if(err) {
                   console.log(err);
                   res.redirect("/comments");
               } else {
                   res.redirect("/comments");
               }
           })
       } else {
           console.log("Movie not exist in database. Check if you're typing it right");
           res.redirect("/comments");
       }
    });
   
   
});

app.get("/comments", (req, res) => {
    
    const filtered = req.query.filtered;
    if(filtered == undefined) {
       Movie.find({}, function(err, movies) {
        if(err) {
            console.log(err);
        } else {
            res.render("comments", {movies: movies});
        }
    });
    } else {
        Movie.find({title: filtered}, function(err, movies) {
        if(err) {
            console.log(err);
        } else {
            res.render("comments", {movies: movies});
        }
    });
    }
});

app.listen(process.env.PORT, process.env.IP, () => {
   console.log("Server started"); 
});