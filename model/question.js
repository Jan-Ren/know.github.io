const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var Question = mongoose.model("Question",{
    title : {type : String, required: true},
    tag : {type : String, required: true},
    topic : {type : String, required: true},
    user : {type : mongoose.Types.ObjectId, ref : 'User'},
    answer : [{type : Schema.Types.ObjectId, ref : 'Answer'}]
})

module.exports = {
    Question
}
