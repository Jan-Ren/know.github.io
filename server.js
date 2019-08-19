const express = require("express")
const bodyparser = require("body-parser")
const session = require("express-session")
const cookieparser = require("cookie-parser")
const mongoose = require("mongoose")
const moment = require("moment")

var bcrypt = require('bcrypt');
const saltRounds = 10;

const {User} = require("./model/user.js")//gives a user object
const {Question} = require("./model/question.js")//gives a question object
const {Answer} = require("./model/answer.js") // gives an answer object

const app = express()

mongoose.Promise = global.Promise
mongoose.connect("mongodb+srv://Marso252:gunplay@cluster0-1vhux.mongodb.net/test?retryWrites=true&w=majority",{
    useNewUrlParser: true
})

//taga basa ng body na ipapasa server
const urlencoder = bodyparser.urlencoded({
    extend : false
})

app.use(express.static(__dirname + "/public"))
app.use(session({
    secret: "secretname",
    name:"cookiename",
    resave : true, //will receive the session id
    saveUninitialized : true, // no session yet will be saved
    cookie:{
        maxAge: 1000*60*24*365*2
    }
}))

app.use(cookieparser())

//app.get("/", function(req,res){
//    if(req.session.view){
//        req.session.view++
//    }else{
//        req.session.view = 1
//    }
//    res.send("Views: " + req.session.view)
//})
app.get("/", function(req,res){

    if(!req.session.username){
        res.sendFile(__dirname + '/public/signin.html')
    }
    else{
        console.log(req.session.usernameID)
        username : req.session.username,
        User.findOne({
            _id : req.session.usernameID
        },(err,doc)=>{
             if(err){
                 res.send(err)
             } else if(doc){
                 req.session.username = doc.username,
                 Question.find().populate('userID','username question answer').exec((err,docs)=>{
                    if(err){
                        res.send(err)
                    }else{
                        res.render("home.hbs",{
                            user : doc,
                            question : docs
                        })
                        }
                    })
             }else{
                 res.send("user not found")
             }
        })
    }
})
app.get("/signup", function(req,res){
    res.sendFile(__dirname + '/public/signup.html')
})
app.get("/profile", function(req, res) {
    res.render("profile.hbs", {
                username: req.session.username
               })
})
app.get("/messages", function(req, res) {
    res.render("messages.hbs", {
                username: req.session.username
               })
})
app.get("/rooms", function(req, res) {
    res.render("room.hbs", {
                username: req.session.username
               })
})
//Go logout
app.post("/logout", urlencoder, (req,res)=>{
    if (req.session) {
        // delete session object
        req.session.destroy(function(err) {
          if(err) {
            return next(err);
          } else {
            res.sendFile(__dirname + '/public/signin.html')
          }
        });
      }
})
//used to go the seeAnswers.hbs for home buttons
app.post("/seeAnswer", urlencoder, (req,res)=>{
    //example of multiple populate
    // var populateQuery = [{path:'books', select:'title pages'}, {path:'movie', select:'director'}];

    // Person.find({})
    // .populate(populateQuery)
    // .execPopulate()

    var populateQuery = [{path: 'answerID',populate: { path: 'userID' }}, {path:'userID', select:'_id username questionID answerID'}];
    //console.log('DITOOOO YUNG BAGO')
   // console.log(req.body.seeAnswerQ)
    User.findOne({
        _id : req.body.seeAnswerUN
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             req.session.username = doc.username,
             Question.findOne({
                _id : req.body.seeAnswerQ,
                 
             }).populate(populateQuery).exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                    res.render("seeAnswers.hbs",{
                        user : doc,
                        question : docs
                    })
                    }
                })
         }else{
             res.send("user not found")
         }
    })

})
//used to refresh the home.hbs for feedFilter buttons
app.post("/feedFilter", urlencoder, (req,res)=>{
    //example of multiple populate
    // var populateQuery = [{path:'books', select:'title pages'}, {path:'movie', select:'director'}];

    // Person.find({})
    // .populate(populateQuery)
    // .execPopulate()
    User.findOne({
        _id : req.body.feedFilter_homeUN
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
            //console.log(doc)
             req.session.username = doc.username,
             Question.find({
                 topic : req.body.feedFilterUN
             }).populate('userID','username question answer').exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                   // console.log(doc)
                   // console.log(docs)
                    res.render("home.hbs",{
                        user : doc,
                        question : docs
                    })
                    }
                })
         }else{
             res.send("user not found")
         }
    })

})
//used to refresh the home.hbs for home buttons
app.post("/home", urlencoder, (req,res)=>{
    //example of multiple populate
    // var populateQuery = [{path:'books', select:'title pages'}, {path:'movie', select:'director'}];

    // Person.find({})
    // .populate(populateQuery)
    // .execPopulate()

    User.findOne({
        _id : req.body.refresh_homeUN
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             req.session.username = doc.username,
             Question.find().populate('userID','username question answer').exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                    res.render("home.hbs",{
                        user : doc,
                        question : docs
                    })
                    }
                })
         }else{
             res.send("user not found")
         }
    })

})
//transition > profile > answers
app.post("/profile_answers", urlencoder, (req,res)=>{

    var populateAnotherQuery=[
        { path: 'questionID', populate: { path: 'userID', select:'username' },select:'title topic date_time' },
        { path: 'userID', select:'username' }
    ]

    var populateQuery = [
        {path: 'questionID',populate: { path: 'userID', select:'username' }, select:'title topic date_time'},
        {path: 'answerID', populate: populateAnotherQuery, select:'answer date_time'}
    ];

    //gets the current user to establish the current users data when vieweing a profile
    var curr_user;
    //finding the cururent user
    User.findOne({
        _id : req.session.usernameID
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             curr_user = doc;
         }else{
             res.send("user not found")
         }
    })
    //finding the profile that was clicked
    User.findOne({
        _id: req.body.profile_answersUN
    }).populate(populateQuery).exec((err, doc)=>{
        if(err){
            res.send(err)
        }else{
            //console.log(doc)
            res.render("profile_answers.hbs",{
                user : doc,
                curr_user : curr_user
            })
        }
    })

        
})
//transition > profile > questions
app.post("/profile_questions", urlencoder, (req,res)=>{

    var populateQuery = [
        {path: 'questionID',populate: { path: 'userID', select:'username' }, select:'title topic date_time'},
        {path: 'answerID', populate: { path: 'questionID', populate: { path: 'userID', select:'username' },select:'title topic date_time' }, select:'answer'}
    ];
    //gets the current user to establish the current users data when vieweing a profile
    var curr_user;
    //finding the cururent user
    User.findOne({
        _id : req.session.usernameID
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             curr_user = doc;
         }else{
             res.send("user not found")
         }
    })
    //finding the profile that was clicked
    User.findOne({
        _id: req.body.profile_questionsUN
    }).populate(populateQuery).exec((err, doc)=>{
        if(err){
            res.send(err)
        }else{
            //console.log(doc)
            res.render("profile_questions.hbs",{
                user : doc,
                curr_user : curr_user
            })
        }
    })

        
})
//transition > profile
app.post("/profile", urlencoder, (req,res)=>{

    var populateQuery = [
        {path: 'questionID',populate: { path: 'userID', select:'username' }, select:'title topic date_time'},
        {path: 'answerID', populate: { path: 'questionID', populate: { path: 'userID', select:'username' },select:'title topic' }, select:'answer'}
    ];

    //gets the current user to establish the current users data when vieweing a profile
    var curr_user;
    //finding the cururent user
    User.findOne({
        _id : req.session.usernameID
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             curr_user = doc;
         }else{
             res.send("user not found")
         }
    })
    //finding the profile that was clicked
    User.findOne({
        _id: req.body.profileUN
    }).populate(populateQuery).exec((err, doc)=>{
        if(err){
            res.send(err)
        }else{
            //console.log(doc)
            res.render("profile.hbs",{
                user : doc,
                curr_user : curr_user
            })
        }
    })

        
})
app.post("/settings", urlencoder, (req,res)=>{

    var populateQuery = [
        {path: 'questionID',populate: { path: 'userID', select:'username' }, select:'title topic'},
        {path: 'answerID', populate: { path: 'questionID', populate: { path: 'userID', select:'username' },select:'title topic' }, select:'answer'}
    ];

    //gets the current user to establish the current users data when vieweing a profile
    var curr_user;
    //finding the cururent user
    User.findOne({
        _id : req.session.usernameID
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
            res.render("settings.hbs",{
                user : doc,
                pass : req.session.password
            })
         }else{
             res.send("user not found")
         }
    })
    //finding the profile that was clicked
    // User.findOne({
    //     _id: req.body.profileUN
    // }).populate(populateQuery).exec((err, doc)=>{
    //     if(err){
    //         res.send(err)
    //     }else{
    //         //console.log(doc)
    //         res.render("settings.hbs",{
    //             user : doc,
    //             curr_user : curr_user
    //         })
    //     }
    // })

        
})
//transition from profile>bookmark
app.post("/bookmark", urlencoder, (req,res)=>{
    User.findOne({
        _id: req.body.bookmarkUN

    },(err, doc)=>{
        if(err){
            res.send(err)
        }else{
            res.render("bookmarks.hbs",{
                user : doc
            })
        }
    })

        
})
//register
app.post("/signup_in_signin", urlencoder, (req,res)=>{
    res.sendFile(__dirname + '/public/signup.html')
})
// save an answer
app.post("/add_answer_submit", urlencoder, (req,res)=>{
    
    let answer = req.body.add_ans_submit
    let question = req.body.add_AnswerQ_submit // question id
    let user = req.body.add_AnswerUN_submit // user id
    let date_time = moment() 
    var populateQuery = [{path: 'answerID',populate: { path: 'userID' }}, {path:'userID', select:'_id username questionID answerID'}];
    
    let ans = new Answer({
        answer : answer,
        questionID : question,
        date_time : date_time,
        userID :  user
    })

    ans.save().then((doc)=>{
        //all goes well
        //updating the answers of the 
        let answer_id = doc._id
        User.findOneAndUpdate(
            { _id: req.body.add_AnswerUN_submit }, 
            { $push: { 
                answerID : answer_id
              }  },
           function (error, success) {
                 if (error) {
                     console.log(error);
                 } else {
                     console.log(success);
                 }
             });

        Question.findOneAndUpdate(
           { _id: req.body.add_AnswerQ_submit}, 
           { $push: { 
                    answerID : answer_id
             }  },
          function (error, success) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(success);
                }
            });

        User.findOne({
            _id : req.body.add_AnswerUN_submit
        },(err,doc)=>{
             if(err){
                 res.send(err)
             } else if(doc){
                 req.session.username = doc.username,
                 Question.findOne({
                    _id : req.body.add_AnswerQ_submit

                 }).populate(populateQuery).exec((err,docs)=>{
                    if(err){
                        res.send(err)
                    }else{
                        res.render("seeAnswers.hbs",{
                            user : doc,
                            question : docs
                        })
                        }
                    })
             }else{
                 res.send("user not found")
             }
        })
    },(err)=>{
        //fial
        res.send(err)
    })

})
// saves a question
app.post("/add_question_submit", urlencoder, (req,res)=>{
    
    let title = req.body.question_title
    let topic = req.body.ts
    let user = req.body.add_QuestionUN_submit // user id
    let date_time = moment()
    //console.log(req.body.add_QuestionUN_submit + "server ito")
    //console.log(date_time)
    let question = new Question({
        title : title,
        topic : topic,
        date_time : date_time,
        userID :  user
    })

    question.save().then((doc)=>{
        //all goes well

        let question_id = doc._id
        User.findOneAndUpdate(
            { _id: req.body.add_QuestionUN_submit }, 
            { $push: { 
                questionID : question_id
              }  },
           function (error, success) {
                 if (error) {
                     console.log(error);
                 } else {
                     console.log(success);
                 }
             });
         
        // User.findOneAndUpdate({
        //     _id: req.body.add_QuestionUN_submit
        // },{
        //     $push: { 
        //         questionID : {
        //           question_id
        //           }  
        //       } 
        // })

        // User.findOne({
        //     _id: req.body.add_QuestionUN_submit
    
        // },(err, doc)=>{
        //     if(err){
        //         res.send(err)
        //     }else{
        //         res.render("addQuestion.hbs",{
        //             user : doc
        //         })
        //     }
        // })

        var populateQuery = [{path: 'answerID',populate: { path: 'userID' }}, {path:'userID', select:'_id username questionID answerID'}];
        User.findOne({
            _id : req.body.add_QuestionUN_submit
        },(err,doc)=>{
             if(err){
                 res.send(err)
             } else if(doc){
                 req.session.username = doc.username,
                 Question.findOne({
                    _id : question_id,
                 }).populate(populateQuery).exec((err,docs)=>{
                    if(err){
                        res.send(err)
                    }else{
                        res.render("seeAnswers.hbs",{
                            user : doc,
                            question : docs
                        })
                        }
                    })
             }else{
                 res.send("user not found")
             }
        })
        // User.update({
        //     _id : req.body.add_QuestionUN_submit
        // },{
        //     questionID : doc._id
        // },(err, doc)=>{
        //     if(err){
        //         res.send(err)
        //     }else{
                
        //     }
        // })
    },(err)=>{
        //fial
        res.send(err)
    })

})
// transition to adding a question
app.post("/addQuestion", urlencoder, (req,res)=>{
    User.findOne({
        _id: req.body.addQuestionUN

    },(err, doc)=>{
        if(err){
            res.send(err)
        }else{
            res.render("addQuestion.hbs",{
                user : doc
            })
        }
    })

})

app.post("/signin", urlencoder, function(req, res){
    // check user name + password in database
    // select * from users where un == un && pw == 
   let username = req.body.un
   let password = req.body.pw
   let user, question;
  
   User.findOne({
       username : username,
      
   },(err,doc)=>{
        if(err){
            res.send(err)
        } else if(doc){
            user = doc;
            bcrypt.compare(password, user.password, function (err, result) {
                if (result == true) {
                    req.session.password = req.body.pw,
                    req.session.username = doc.username,
                    req.session.usernameID = doc._id,
                    
                    Question.find().populate('userID','username question answer').exec((err,docs)=>{
                        if(err){
                            res.send(err)
                        }else{
                           
                            res.render("home.hbs",{
                                user : doc,
                                question : docs
                            })
                        }
                    })
                }
                else {
                    res.send('Incorrect password');
                
                }
            });
     
            
        }else{
            res.send("user not found")
        }
   })
})

app.post("/signup", urlencoder, function(req, res){
    //add user to database
    var username = req.body.un
    var password = req.body.pw
    var email = req.body.email

    bcrypt.hash(password, saltRounds, function (err,   hash) {
            console.log("Yo")
         console.log("hash")
        
        password = hash;
        let user = new User({
        username : username,
        password : hash,
        email : email
    })

    user.save().then((doc)=>{
        //all goes well
        req.session.password = req.body.pw
        req.session.username = doc.username,
        req.session.usernameID = doc._id,
        User.findOne({
            _id : req.session.usernameID
        },(err,doc)=>{
             if(err){
                 res.send(err)
             } else if(doc){
                 req.session.username = doc.username,
                 Question.find().populate('userID','username question answer').exec((err,docs)=>{
                    if(err){
                        res.send(err)
                    }else{
                        res.render("home.hbs",{
                            user : doc,
                            question : docs
                        })
                        }
                    })
             }else{
                 res.send("user not found")
             }
        })
    },(err)=>{
        //fial
        res.send(err)
    })
 });
    
})
app.post("/search", urlencoder, function(req, res) {
    var searchcont = req.body.searchq
    var idsearch = req.body.usersearchid
    //console.log(idsearch)
    var populateQuery = [{path: 'questionID',populate: { path: 'userID' }}, {path:'userID', select:'username questionID answerID'}];
    User.findOne({
        _id : idsearch
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             req.session.username = doc.username,
             Question.find({ title: { $regex: searchcont, $options: "i" } }).populate('userID','username question answer').exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                    Answer.find(
                        {answer:{ $regex: searchcont, $options: "i" } 
                        }
                    ).populate(populateQuery).exec((err2, docs2)=> {
                        if (err) {
                            res.send(err2)
                        }
                        else {
                        res.render("search.hbs",{
                        searchquery: searchcont,
                        user : doc,
                        question : docs,
                        answer: docs2
                        }
                    )
                    }
                                   })
                    /*res.render("search.hbs",{
                        user : doc,
                        question : docs
                    })*/
                    }
                })
         }
    })
})
app.post("/searchquestfilt", urlencoder, function(req, res) {
    var searchcont = req.body.searchq2
    var idsearch = req.body.usersearchid2
    //console.log(idsearch)
    var populateQuery = [{path: 'questionID',populate: { path: 'userID' }}, {path:'userID', select:'username questionID answerID'}];
    User.findOne({
        _id : idsearch
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             req.session.username = doc.username,
             Question.find({ title: { $regex: searchcont, $options: "i" } }).populate('userID','username question answer').exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                    Answer.find(
                        {answer:{ $regex: searchcont, $options: "i" } 
                        }
                    ).populate(populateQuery).exec((err2, docs2)=> {
                        if (err) {
                            res.send(err2)
                        }
                        else {
                        res.render("searchQuestions.hbs",{
                        searchquery: searchcont,
                        user : doc,
                        question : docs,
                        answer:docs2
                        }
                    )
                    }
                                   })
                    /*res.render("search.hbs",{
                        user : doc,
                        question : docs
                    })*/
                    }
                })
         }
    })
})
app.post("/searchansfilt", urlencoder, function(req, res) {
    var searchcont = req.body.searchq3
    var idsearch = req.body.usersearchid3
    //console.log(idsearch)
    var populateQuery = [{path: 'questionID',populate: { path: 'userID' }}, {path:'userID', select:'username questionID answerID'}];
    User.findOne({
        _id : idsearch
    },(err,doc)=>{
         if(err){
             res.send(err)
         } else if(doc){
             req.session.username = doc.username,
             Question.find({ title: { $regex: searchcont, $options: "i" } }).populate('userID','username question answer').exec((err,docs)=>{
                if(err){
                    res.send(err)
                }else{
                    Answer.find(
                        {answer:{ $regex: searchcont, $options: "i" } 
                        }
                    ).populate(populateQuery).exec((err2, docs2)=> {
                        if (err) {
                            res.send(err2)
                        }
                        else {
                        res.render("searchAnswers.hbs",{
                        searchquery: searchcont,
                        user : doc,
                        question : docs,
                        answer:docs2
                        }
                    )
                    }
                                   })
                    /*res.render("search.hbs",{
                        user : doc,
                        question : docs
                    })*/
                    }
                })
         }
    })
})
app.post("/back", urlencoder, function(req, res) {
    console.log("Back")
    res.redirect("/")
})
app.post("/update", urlencoder, function(req, res){
    var checkid = req.body.id 
    //console.log(checkid)
    var passw = req.body.pw
    bcrypt.hash(passw, saltRounds, function (err,   hash) {
            console.log("Yo2")
         console.log("hash2")
        
        passw = hash;
        console.log(passw)
        User.update({
        
        _id: req.body.id
    }, {
        password: passw
    }, function(err, doc) {
        if(err) {
            res.send(err)
        }
        else {
            var populateQuery = [
                {path: 'questionID',populate: { path: 'userID', select:'username' }, select:'title topic'},
                {path: 'answerID', populate: { path: 'questionID', populate: { path: 'userID', select:'username' },select:'title topic' }, select:'answer'}
                ];

            // //gets the current user to establish the current users data when vieweing a profile
            // var curr_user;
            // //finding the cururent user
            User.findOne({
            _id : req.session.usernameID
            },(err,doc)=>{
                if(err){
                    res.send(err)
                } else if(doc){
                    res.render("settings.hbs",{
                    user : doc
                    })
                }else{
                    res.send("user not found")
                }
            })
        }
        
    }) 
    })
     //1st argument where, 2nd argument update
})
// add bookmark
/*
app.post("/addBookmark", urlencoder, (req,res)=>{
    console.log("add bookmark" + req.body.id)
    //delete user data in the db
    User.findOneAndUpdate(
        { _id: req.session.usernameID},
        { $push: {
            bookmarkID : question_id
          }  },
       function (error, success) {
             if (error) {
                 console.log(error);
             } else {
                 console.log(success);
             }
    });
})
*/
app.use("*", function(request,response){
    response.send("This is not the site you're looking for.")
    
})

app.listen(process.env.PORT || 3000)