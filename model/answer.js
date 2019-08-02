const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var Answer = mongoose.model("Answer",{
    answer : {type : String, required: true},
    questionID : {type : Schema.Types.ObjectId, ref : 'Question'},
    userID : {type : Schema.Types.ObjectId, ref : 'User'}
})

module.exports = {
    Answer
}
