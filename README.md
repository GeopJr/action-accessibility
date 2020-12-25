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
    types: opened
  issues:
    types: opened
  issue_comment:
    types: created

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: GeopJr/action-accessibility@v2.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

# In-action:

This is an example issue:
![example issue](https://i.imgur.com/5ixNhAY.png)
This is the reply:

```
Accessibility Links:
[Audio](https://gofile.io/d/P2CS2q)
[Image](https://gofile.io/d/Awd1Dk)
The action was triggered by [this comment](https://github.com/GeopJr/test1/pull/3#issuecomment-751280826) from [GeopJr](https://github.com/GeopJr).
```

(You can see more on the issues and pull requests pages of this repo.)

# Cloning
All branches except `dev` are pretty big in size.
To clone just that all you have to do is
```sh
$ git clone https://github.com/GeopJr/action-accessibility -b dev
```

# Contributing

#### All contributions are welcome!
Please ensure the following apply before opening a PR:
- You are creating a PR for the `dev` branch
- `npm run prepare` / `yarn prepare` complete successfully 
- You are on node12 (this is the biggest versions GitHub allows at the moment)
- `npm run lint` / `yarn lint` complete successfully (feel free to run `lint:fix` to auto fix most of the warns & errors)
- You are not pushing (the huge) `dist/` folder

## I am not an expert in A11Y, if you feel like something can be improved, please open an issue and I'll try to do it as soon as possible!

This was [my submission](https://dev.to/geopjr/action-accessibility-a-github-action-for-those-in-need-hg7) for the [DEV.TO Action Hackathon](https://dev.to/devteam/announcing-the-github-actions-hackathon-on-dev-3ljn).
