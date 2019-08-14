const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var User = mongoose.model("User",{
    username : {type : String, required: true},
    password : {type : String, required: true},
    email : {type : String, required : true},
    bookmarkedID :  [{type : Schema.Types.ObjectId, ref : 'Answer'}],
    questionID : [{type : Schema.Types.ObjectId, ref : 'Question'}],
    answerID : [{type : Schema.Types.ObjectId, ref : 'Answer'}]
})

module.exports = {
    User
}
