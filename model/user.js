const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var User = mongoose.model("User",{
    username : {type : String, required: true},
    password : {type : String, required: true},
    email : {type : String, required : true},
    bookmarkedID :  [{type : Schema.Types.ObjectId, ref : 'Answer'}],
    questionID : [{type : Schema.Types.ObjectId, ref : 'Question'}],
    answerID : [{type : Schema.Types.ObjectId, ref : 'Answer'}],
    followersID : [{type : Schema.Types.ObjectId, ref : 'User'}],
    followingID : [{type : Schema.Types.ObjectId, ref : 'User'}]
})

module.exports = {
    User
}
