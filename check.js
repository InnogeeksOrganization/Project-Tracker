const mongoose = require('mongoose');
const { Octokit } = require('octokit');
const fs = require('fs');
const Project = require('./config/project');
const User = require('./config/user');
require('dotenv').config();

//Initialization
const octokit = new Octokit({ auth: process.env.GIT_TOKEN });
mongoose.connect(process.env.DB_STRING, () => { console.log("Connected to MongoDB.") });


// function to chaeck who closed the issue
const issueClosedByChecker = async (owner, repo, issue_number) => {
    const events = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/events', {
        owner,
        repo,
        issue_number
    })
    const closedEvent = events.data.find(event => event.event === 'closed');
    if (closedEvent) {
        const closerUsername = closedEvent.actor.login;
        return closerUsername;
    }
};


// Tracks all projects in the DB

let Total = 0;

const track = async() => {

    const d = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    fs.appendFileSync('track.log', `Tracked at ${d} \n`);

    const projects = await Project.find();

    for (let project of projects) {
        const owner = project.owner.ownerUsername;
        const repo = project.projectName;
	console.log(repo, owner);
        const resp = await octokit.paginate('GET /repos/{owner}/{repo}/issues{?milestone,state,assignee,creator,mentioned,labels,sort,direction,since,per_page,page}', {
            owner,
            repo,
            state: 'closed',
            since: '2024-01-09T18:30:00.000Z',
            per_page: '100'
        });

        for (let issue of resp) {

            const closedBy = await issueClosedByChecker(owner, repo, issue.number);
		console.log(closedBy, issue.number);
            const isIWOC = issue.labels.find((element) => { return element.name.trim().toLowerCase() === "iwoc2025" });            

            if(isIWOC && issue.pull_request === undefined && closedBy !== owner) {
                Total++;
                console.log("not closed by maintainer", closedBy, closedBy === owner);
            }
        }

        console.log(Total);
    };
}

const startTrack = async() => {
    fs.appendFileSync('track.log', '--------------------------------------\n');
    await track();
    await timeout(60);
    await startTrack();
}

const timeout = async(ms) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * ms));
}


// To start tracking projects
startTrack();
