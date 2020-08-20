const core = require('@actions/core'),
      exec = require("@actions/exec");

async function run() {
  try {
    await exec.exec('sudo', ['apt-get', 'install', '-y', 'espeak']);
  } catch (error) {
    core.setFailed(error.message);
    return false;
  }
}

run();
