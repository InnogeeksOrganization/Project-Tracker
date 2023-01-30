const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    ownerName: String,
    ownerId: String,
    ownerUsername: String,
    avatar_url: String,
    profile_url: String,
});


const projectSchema = new mongoose.Schema({
    projectId: String,
    projectName:String,
    projectUrl:String,
    description:String,
    language: [String],
    topic: [String],
    open_issues: Number,
    stars: Number,
    difficulty: String,
    owner: ownerSchema,
    repo_created_at:String,
    repo_updated_at:String,
    repo_pushed_at:String,
    date: String
},{timestamps:true});


const Project = new mongoose.model('Project',projectSchema);

module.exports = Project;