const mongoose = require('mongoose');
const { Octokit } = require('octokit');
const fs = require('fs');
const Project = require('./config/project');
const User = require('./config/user');
require('dotenv').config();

//Initialization
const octokit = new Octokit({ auth: process.env.GIT_TOKEN });
mongoose.connect(process.env.DB_STRING, () => { console.log("Connected to MongoDB.") });


//For adding projects to DB
const fetchAndAddProject = async(link) => {
    const newLink = link.replace(/[\r\n]+/gm, "");
    const resp = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: newLink.split('/')[3],
        repo: newLink.split('/')[4]
    })
    const tc = [];
    for (let topic of resp.data.topics) {
        tc.push(topic);
    }
    await Project.create({
        projectId: resp.data.id,
        projectName: resp.data.name,
        projectUrl: resp.data.html_url,
        description: resp.data.description,
        language: [resp.data.language],
        topic: tc,
        open_issues: resp.data.open_issues,
        stars: resp.data.stargrazers_count,
        difficulty: "NA",
        owner: {
            ownerId: resp.data.owner.id,
            ownerUsername: resp.data.owner.login,
            avatar_url: resp.data.owner.avatar_url,
            profile_url: resp.data.owner.html_url
        },
        repo_created_at: new Date(resp.data.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        repo_updated_at: new Date(resp.data.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        repo_pushed_at: new Date(resp.data.pushed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
    const project = await Project.find()
    console.log(project.length)
}


// Tracks all projects in the DB
const track = async() => {

    const d = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    fs.appendFileSync('track.log', `Tracked at ${d} \n`);

    const projects = await Project.find();

    for (let project of projects) {
        const resp = await octokit.paginate('GET /repos/{owner}/{repo}/issues{?milestone,state,assignee,creator,mentioned,labels,sort,direction,since,per_page,page}', {
            owner: project.owner.ownerUsername,
            repo: project.projectName,
            state: 'closed',
            since: '2023-01-31T18:30:00.000Z',
            per_page: '100'
        });

        for (let issue of resp) {
            if (issue.pull_request == undefined) {

                const isIWOC = issue.labels.find((element) => { return element.name.toLowerCase() === "iwoc" });

                if (isIWOC) {

                    const assignees = issue.assignees;

                    for (let assignee of assignees) {

                        const user = await User.findOne({ userid: assignee.id });

                        if (user !== null) {
                            const recordExists = user.scoresRecord.find((element) => { return element.Issue_ID == issue.id });

                            if (!recordExists) {

                                let diffScore = 0;
                                let difficulty = "NA";
                                let labels = [];

                                for (let label of issue.labels) {
                                    labels.push(label.name.toLowerCase());

                                    switch (label.name.toLowerCase()) {
                                        case "easy":
                                            diffScore = 10;
                                            difficulty = "easy";
                                            break;
                                        case "medium":
                                            diffScore = 30;
                                            difficulty = "medium";
                                            break;
                                        case "hard":
                                            diffScore = 50;
                                            difficulty = "hard";
                                            break;
                                        default:
                                            break;
                                    }
                                }

                                if (difficulty !== "NA") {

                                    user.score += diffScore;

                                    user.scoresRecord.push({
                                        Issue_ID: issue.id,
                                        projectId: project.projectId,
                                        projectName: project.projectName,
                                        score: diffScore,
                                        Issue: {
                                            Issue_ID: issue.id,
                                            Issue_number: issue.number,
                                            Issue_title: issue.title,
                                            Issue_labels: labels,
                                            Issue_difficulty: difficulty,
                                            Issue_url: issue.html_url,
                                            Issue_createdAt: issue.created_at,
                                            Issue_updatedAt: issue.updated_at,
                                            Issue_closedAt: issue.closed_at
                                        },
                                        author_association: issue.author_association,
                                        DBdate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                                    });

                                    await user.save();
                                }
                                else {
                                    fs.appendFileSync('IrregularTag.log', '--------------------------------------\n');
                                    fs.appendFileSync('IrregularTag.log', `Difficulty tag not found in ${issue.html_url} \n`);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}


// startTrack() logs and calls track() after every 60 seconds
const startTrack = async() => {
    fs.appendFileSync('track.log', '--------------------------------------\n');
    await track();
    await timeout(60);
    await startTrack();
}

const timeout = async(ms) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * ms));
}

// For adding multiple projects
const addProjects = async(data) => {
    for (let d of data) {
        console.log(d);
        await fetchAndAddProject(d);
    }
}



// To start tracking projects
// startTrack();

// To add projects from projectsData.csv

// Format of projectData.csv
// projectRepoLink1,projectRepoLink2,projectRepoLink3,projectRepoLink4

const data = fs.readFileSync('projectsData.csv', 'utf8').split(',');
addProjects(data);