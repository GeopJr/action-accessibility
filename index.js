const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')
const fsPromise = fs.promises
const text2png = require('text2png')
const fetch = require('node-fetch')
const FormData = require('form-data')
const execute = require('@actions/exec')
const remark = require('remark')
const strip = require('strip-markdown')

async function dependencies () {
  try {
    await execute.exec('sudo', ['apt-get', 'install', '-y', 'espeak'])
    await execute.exec('wget', [
      '-O',
      'OpenDyslexic-Regular.otf',
      'https://raw.githubusercontent.com/antijingoist/opendyslexic/master/compiled/OpenDyslexic-Regular.otf'
    ])
  } catch (error) {
    core.setFailed(error.message)
    return false
  }
}

function speak (text) {
  const { exec } = require('child_process')

  fs.writeFileSync('body.txt', text)

  const outputFile = 'tts.wav'
  const voice = 'en-uk-north'
  const command = `espeak -v ${voice} -f body.txt --stdout > ${outputFile}`

  return new Promise(resolve => {
    exec(command, (err, stout, sterr) => {
      if (err) {
        core.setFailed(err.message)
        throw err
      }
      resolve(err ? stout : sterr)
    })
  })
}

function stripMd (input) {
  return String(
    remark()
      .use(strip)
      .processSync(input, { keep: ['code'] })
  )
}

async function saveImage (input) {
  const success = true
  try {
    await fsPromise.appendFile(
      'image.png',
      text2png(input, {
        font: '30px OpenDyslexic',
        backgroundColor: 'white',
        localFontPath: './OpenDyslexic-Regular.otf',
        localFontName: 'OpenDyslexic'
      })
    )
  } catch (err) {
    core.setFailed(err.message)
    throw err
  }
  return success
}

async function getServer () {
  const url = 'https://apiv2.gofile.io/getServer'
  try {
    const response = await fetch(url)
    const json = await response.json()
    if (json.status === 'ok') {
      return `https://${json.data.server}.gofile.io/uploadFile`
    } else {
      core.setFailed('[ERROR]: GoFile returned ' + json.status)
      return process.exit(1)
    }
  } catch (err) {
    core.setFailed(err.message)
    throw err
  }
}

async function upload (file, filename, url) {
  const buffer = await fsPromise.readFile('./' + file)

  try {
    const form = new FormData()
    form.append('file', buffer, {
      name: 'file',
      filename: filename
    })
    const response = await fetch(url, {
      method: 'POST',
      body: form
    })
    const json = await response.json()
    if (json.status === 'ok') {
      return `https://gofile.io/d/${json.data.code}`
    } else {
      core.setFailed('[ERROR]: GoFile returned ' + json.status)
      return process.exit(1)
    }
  } catch (err) {
    core.setFailed(err.message)
    throw err
  }
}

function createComment (type, number, body) {
  const token = core.getInput('token')
  const octokit = github.getOctokit(token)
  const octokitBody = {}
  octokitBody.owner = github.context.payload.repository.owner.login
  octokitBody.repo = github.context.payload.repository.name
  octokitBody.body = body

  if (type === 'issues') {
    octokitBody.issue_number = number
    return octokit.issues.createComment(octokitBody)
  } else if (type === 'issue_comment') {
    octokitBody.issue_number = number
    return octokit.issues.createComment(octokitBody)
  } else if (type === 'pull_request') {
    octokitBody.pull_number = number
    octokitBody.event = 'COMMENT'
    return octokit.pulls.createReview(octokitBody)
  }
}

function replyBody (imageUrl, audioUrl, extra) {
  return (
    'Accessibility Links:\n[Audio](' +
    audioUrl +
    ')\n[Image](' +
    imageUrl +
    ')\n' +
    extra
  )
}

async function run () {
  try {
    await dependencies()
    const type = github.context.eventName
    let comment
    let commentNum
    let extra = ''
    if (
      github.context.eventName === 'issues' &&
      github.context.payload.action === 'opened'
    ) {
      const issue = github.context.payload.issue
      const issueTitle = issue.title
      const issueBody = issue.body
      commentNum = issue.number
      comment =
        'Issue Title: ' +
        issueTitle +
        '\nIssue Body: ' +
        (await stripMd(issueBody))
      extra =
        'The action was triggered by the creation of this issue by [' +
        github.context.payload.sender.login +
        '](' +
        github.context.payload.sender.html_url +
        ').'
    } else if (
      github.context.eventName === 'issue_comment' &&
      github.context.payload.action === 'created'
    ) {
      const issueComment = github.context.payload.comment
      const issueBody = issueComment.body
      commentNum = github.context.payload.issue.number
      comment = 'Issue Comment: ' + (await stripMd(issueBody))
      extra =
        'The action was triggered by [this comment](' +
        issueComment.html_url +
        ') from [' +
        github.context.payload.sender.login +
        '](' +
        github.context.payload.sender.html_url +
        ').'
    } else if (
      github.context.eventName === 'pull_request' &&
      github.context.payload.action === 'opened'
    ) {
      const pullRequest = github.context.payload.pull_request
      const prTitle = pullRequest.title
      const prBody = pullRequest.body
      commentNum = pullRequest.number
      comment =
        'Pull Request Title: ' +
        prTitle +
        '.\nPull Request Body: ' +
        (await stripMd(prBody))
      extra =
        'The action was triggered by the creation of this pull request by [' +
        github.context.payload.sender.login +
        '](' +
        github.context.payload.sender.html_url +
        ').'
    } else {
      core.info('This is not an event Accessibility handles')
      return process.exit(0)
    }

    await speak(comment)
    await saveImage(comment)
    const url = await getServer()
    const audioUrl = await upload('tts.wav', 'tts.wav', url)
    const imageUrl = await upload('image.png', 'image.png', url)

    await createComment(type, commentNum, replyBody(imageUrl, audioUrl, extra))
  } catch (err) {
    core.setFailed(err.message)
    throw err
  }
}

run()
