# Accessibility GitHub Action

Programming is for everyone. People shouldn't be unable to contribute because of disabilities or difficulties.
This is what this action aims to solve!

Every issue opened, every pull request opened, every comment made will be passed through this action, which will
reply with a an image of the text using [OpenDyslexic](https://opendyslexic.org/) as well as an audio TTS of it.

Those files are being uploaded to [GoFile](https://gofile.io/welcome), please support them on [Patreon](https://www.patreon.com/gofile).

# Example:

```yml
name: Accessibility
on:
  pull_request:
    types: [opened, edited]
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created, edited]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: GeopJr/action-accessibility@v1.0.9
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
```

# In-action:

This is an issue: 
![issue](https://i.postimg.cc/4NdJL2wt/2020-08-20-23-45.png)
This is the reply:
```
Accessibility Links:
Audio Link:https://gofile.io/d/hUSyNh
Image Link:https://gofile.io/d/zq8ZlI
```
(You can see more on the issues and pull requests pages of this repo. Files might have been removed by users that don't like a11y.)

This is [my submission](https://dev.to/geopjr/action-accessibility-a-github-action-for-those-in-need-hg7) for [DEV.TO Action Hackathon](https://dev.to/devteam/announcing-the-github-actions-hackathon-on-dev-3ljn). 
