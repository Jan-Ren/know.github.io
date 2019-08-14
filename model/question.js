const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var Question = mongoose.model("Question",{
    title : {type : String, required: true},
    tag : {type : String, required: true},
    topic : {type : String, required: true},
    date_time : {type : String, required: true},
    userID : {type : Schema.Types.ObjectId, ref : 'User'},
    answerID : [{type : Schema.Types.ObjectId, ref : 'Answer'}]
})

module.exports = {
    Question
}
