var mongoose = require("mongoose");

var pollSchema = mongoose.Schema({
    createdByUser   : String,   //use twitter username
    topic           : String,
    optionList          : [{
        optionName      : String,
        votedUsers       : []
    }]
});

//checking if login user is the create user
pollSchema.methods.isCreateByUser = function(username) {
    return this.createdByUser === username;  
};

module.exports = mongoose.model('Poll', pollSchema);