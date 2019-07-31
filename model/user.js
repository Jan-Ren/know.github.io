const mongoose = require("mongoose")
var Schema = mongoose.Schema;

var User = mongoose.model("User",{
    username : {type : String, required: true},
    password : {type : String, required: true},
    email : {type : String, required : true},
    question : [{type : Schema.Types.ObjectId, ref : 'Question'}],
    answer : [{type : Schema.Types.ObjectId, ref : 'Answer'}]
})

module.exports = {
    User
}
