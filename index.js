const core = require('@actions/core'),
    github = require('@actions/github'),
    removeMd = require('remove-markdown'),
    fs = require("fs").promises,
    text2png = require('text2png'),
    fetch = require('node-fetch'),
    FormData = require('form-data')
    execute = require("@actions/exec");

async function dependencies() {
  try {
    await execute.exec('sudo', ['apt-get', 'install', '-y', 'espeak']);
    await execute.exec('wget', ['-O', 'OpenDyslexic-Regular.otf', 'https://raw.githubusercontent.com/antijingoist/opendyslexic/master/compiled/OpenDyslexic-Regular.otf']);
  } catch (error) {
    core.setFailed(error.message);
    return false;
  }
}

async function speak(text) {

const { exec } = require('child_process');

const outputFile = "tts.wav";
const voice = "en-uk-north";
const command = `espeak -v ${voice} -w ${outputFile} "${text}"`;

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.log("Error occurred: ", err);
    return false;
  }
});

return true;
}

function stripMd(input) {
    return removeMd(input, {
        stripListLeaders: true,
        listUnicodeChar: '-'
    });
}

async function saveBuffer(input) {
    let success = true
    try {
        await fs.appendFile('tts.wav', input);
    } catch (err) {
        core.setFailed('[ERROR]:' + err.message);
        success = false;
    }
    return success;
}

async function saveImage(input) {
    let success = true
    try {
        await fs.appendFile('image.jpg', text2png(input, {
            font: "30px OpenDyslexic",
            localFontPath: './OpenDyslexic-Regular.otf',
            localFontName: 'OpenDyslexic'
        }));
    } catch (err) {
        core.setFailed('[ERROR]:' + err.message);
        success = false;
    }
    return success;
}

async function getServer() {
    const url = "https://apiv2.gofile.io/getServer"
    try {
        const response = await fetch(url)
        const json = await response.json()
        return json.status === "ok" ? `https://${json.data.server}.gofile.io/uploadFile` : false;
    } catch (err) {
        core.setFailed('[ERROR]:' + err.message);
        return false
    }
}

async function upload(file, filename, url) {

    const buffer = await fs.readFile('./' + file)

    try {
    const form = new FormData()
        form.append('file', buffer, {
            name: 'file',
            filename: filename,
        });
        const response = await fetch(url, {
            method: 'POST',
            body: form
        })
        const json = await response.json()
        return json.status === "ok" ? `https://gofile.io/d/${json.data.code}` : false;
    } catch (err) {
        core.setFailed('[ERROR]:' + err.message);
        return false
    }
}

async function run() {
    try {
        await dependencies();
        const token = core.getInput('token');
        const octokit = github.getOctokit(token);
        let tts;
        if (github.context.eventName === 'issues') {
            const issue = github.context.payload.issue;
            const issueTitle = issue.title;
            const issueBody = issue.body;
            const strippedBody = stripMd(issueBody);
            const text = "Issue Titile: " + issueTitle + ".\nIssue Body: " + strippedBody
            tts = await speak(text);
            await saveImage(text);
            const url = await getServer();
            const audioUrl = await upload("tts.wav", "tts.wav", url)
            const imageUrl = await upload("image.jpg", "image.jpg", url)
            const replyBody = "Accessibility Links:\nAudio Link:" + audioUrl + "\nImage Link:" + imageUrl
            await octokit.issues.createComment({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                issue_number: issue.number,
                body: replyBody
            });
        } else if (github.context.eventName === 'issue_comment') {
            const issueComment = github.context.payload.comment;
            const issueBody = issueComment.body;
            const strippedBody = stripMd(issueBody)
            const text = "Issue Comment: " + strippedBody

            tts = await speak(text)
            await saveImage(text)
            const audioUrl = await upload("tts.wav", "tts.wav", await getServer());
            const imageUrl = await upload("image.jpg", "image.jpg", await getServer())
            const replyBody = "Accessibility Links:\nAudio Link:" + audioUrl + "\nImage Link:" + imageUrl
            console.log(replyBody, github.context.payload.repository.owner.login, github.context.payload.repository.name, github.context.payload.issue.number)
            await octokit.issues.createComment({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                issue_number: github.context.payload.issue.number,
                body: replyBody
            });
        } else if (github.context.eventName === 'pull_request') {
            const pullRequest = github.context.payload.pull_request;
            const prTitle = pullRequest.title;
            const prBody = pullRequest.body;
            const strippedBody = stripMd(prBody)
            const text = "Pull Request Titile: " + prTitle + ".\nPull Request Body: " + strippedBody
            tts = await speak(text)
            await saveImage(text)
            const url = await getServer();
            const audioUrl = await upload("tts.wav", "tts.wav", url)
            const imageUrl = await upload("image.jpg", "image.jpg", url)
            const replyBody = "Accessibility Links:\nAudio Link:" + audioUrl + "\nImage Link:" + imageUrl
            await octokit.pulls.createReview({
                owner: github.context.payload.repository.owner.login,
                repo: github.context.payload.repository.name,
                pull_number: pullRequest.number,
                event: "COMMENT",
                body: replyBody
            });
        } else {
            core.info('This is not an event Accessibility handles');
            return false;
        }
        await saveBuffer(tts)
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
