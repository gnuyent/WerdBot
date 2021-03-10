# WerdBot

A Discord bot to do some various tasks.

## Supported Commands

* Word-of-the-day from Merriam-Webster and Dictionary.com

```
Merriam-Webster:
<prefix>m
Example:
!m

Dictionary.com
<prefix>d
Example:
!d
```

* Dice roller

```
<prefix>r[oll] CdS[+X]
C = dice count
S = side count
X = optional additive
Example:
!r 2d12
!r 1d6+3
!roll 1d20
!roll 5d6+5
```

* Ping/Pong
```
<prefix>ping
<prefix>pong
Example:
!ping
!pong
```

## Installation

First, install node and npm. Then, clone and enter the repository.


Once inside, add your bot token to `config.json` and run the following commands:

`npm install --only=prod`

`node werd.js`
