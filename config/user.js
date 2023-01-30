const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
    sessionid: String,
    date: String
});

const issueSchema = new mongoose.Schema({
    Issue_ID:Number,
    Issue_number:Number,
    Issue_title:String,
    Issue_labels:[String],
    Issue_difficulty:String,
    Issue_url:String,
    Issue_createdAt:String,
    Issue_updatedAt:String,
    Issue_closedAt:String
});

const scoreSchema = new mongoose.Schema({
    Issue_ID:Number,
    projectId:String,
    projectName:String,
    score:Number,
    Issue:issueSchema,
    author_association:String,
    DBdate:String
},{timestamps: true});


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    libid: String,
    phone: String,
    userid: String,
    displayname:String,
    username:String,
    score:{
        type:Number,
        default:0
    },
    scoresRecord: {
        type:[scoreSchema],
        default: []
    },
    profileUrl:String,
    avatarUrl:String,
    gitEmail:String,
    bio:String,
    blog:String,
    publicRepo:Number,
    followers:Number,
    following:Number,
    sessions: [loginSchema],
},{timestamps:true});


const User = new mongoose.model('User',userSchema);

module.exports = User;