const express = require("express")
const bodyparser = require("body-parser")
const session = require("express-session")
const cookieparser = require("cookie-parser")
const mongoose = require("mongoose")

const {User} = require("./model/user.js")//gives a user object
const {Question} = require("./model/question.js")//gives a question object
const {Answer} = require("./model/answer.js") // gives an answer object

const app = express()

mongoose.Promise = global.Promise
mongoose.connect("mongodb://localhost:27017/users",{
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
        res.render("home.hbs",{
            username : req.session.username
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
//used to refresh the home.hbs for home buttons
app.post("/refresh_home", urlencoder, (req,res)=>{
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
             console.log(doc)
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
// save an answer
app.post("/add_answer_submit", urlencoder, (req,res)=>{
    
    let answer = req.body.answer_textarea
    let question = req.body.add_AnswerQ_submit // question id
    let user = req.body.add_AnswerUN_submit // user id

    let ans = new Answer({
        answer : answer,
        questionID : question,
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
        
        console.log("NANDITOOOOOOOOOOOOOO AKO!" + Question.findOne({_id: req.body.add_AnswerUN_submit}))

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
            _id: req.body.add_AnswerUN_submit 
        },(err,doc)=>{
            if(err){
                res.send(err)
            } else if(doc){
                console.log(doc)
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
        // User.update({
        //     _id : req.body.add_AnswerUN_submit
        // },{
        //     answerID : id_of_answer
        // },(err, doc)=>{
        //     if(err){
        //         res.send(err)
        //     }else{
        //         //updating the answers for the question
        //         Question.update({
        //             _id : req.body.AnswerQ_submit
        //         },{
        //             answerID : id_of_answer
        //         },(err, doc)=>{
        //             console.log(doc._id)
        //             if(err){
        //                 res.send(err)
        //             }else{
        //                 //proceed to refresh the home.hbs
                        
        //             }
        //         })
        //     }
        // })
    },(err)=>{
        //fial
        res.send(err)
    })

})
// saves a question
app.post("/add_question_submit", urlencoder, (req,res)=>{
    
    let title = req.body.question_title
    let tag = req.body.question_tag
    let topic = req.body.ts
    let user = req.body.add_QuestionUN_submit // user id
    console.log(req.body.add_QuestionUN_submit + "server ito")

    let question = new Question({
        title : title,
        tag : tag,
        topic : topic,
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

        User.findOne({
            _id: req.body.add_QuestionUN_submit
    
        },(err, doc)=>{
            if(err){
                res.send(err)
            }else{
                res.render("addQuestion.hbs",{
                    user : doc
                })
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
    console.log(req.body.un)
   let username = req.body.un
   let password = req.body.pw
   let user, question;
   
   User.findOne({
       username : username,
       password : password
   },(err,doc)=>{
        if(err){
            res.send(err)
        } else if(doc){
            console.log(doc)
            req.session.username = doc.username,
            user = doc
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

app.post("/signup", urlencoder, function(req, res){
    //add user to database
    var username = req.body.un
    var password = req.body.pw
    var email = req.body.email
    let user = new User({
        username : username,
        password : password,
        email : email
    })
    
    user.save().then((doc)=>{
        //all goes well
        console.log(doc)
        res.render("home.hbs",{
            username : doc.username
        })
    },(err)=>{
        //fial
        res.send(err)
    })
})

app.use("*", function(request,response){
    response.send("This is not the site you're looking for.")
    
})

app.listen(3002, function(){
    console.log("Now listening in port 3002")
})