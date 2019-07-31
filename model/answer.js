const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var Answer = mongoose.model("Answer",{
    answer : {type : String, required: true},
    bookmarked : {type : Boolean},
    question : {type : Schema.Types.ObjectId, ref : 'Question'},
    user : {type : Schema.Types.ObjectId, ref : 'User'}
})

module.exports = {
    Answer
}
