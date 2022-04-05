# Tiktok-json-extractor

A quick and dirty NodeJS command line tool to extract data from a Tiktok export.

Allows extraction to plaintext / html and videos download.

## Usage

Ask Tiktok to export a copy of your data in JSON format (takes a few days),
download the zip file and extract it.

run ```run npm install``` 

then ```node extract.js``` with the desired options

```
Usage: extract.js -i file.json

Options:
      --version      Show version number                               [boolean]
  -i, --input        json file to parse                      [string] [required]
  -o, --output       output dir                              [string] [required]
      --blocked      blocked users                                     [boolean]
  -c, --chats        chat history                                      [boolean]
      --comments     written comments                                  [boolean]
      --connections  connections history                               [boolean]
      --effects      favorite effects                                  [boolean]
      --favhash      favorite hashtags                                 [boolean]
      --sounds       favorite sounds                                   [boolean]
      --favvids      favorite vids                                     [boolean]
      --followers    followers list                                    [boolean]
      --following    following list                                    [boolean]
      --hashtags     used hashtags                                     [boolean]
  -l, --likes        like list                                         [boolean]
  -s, --searches     search history                                    [boolean]
      --shares       shared vids list                                  [boolean]
      --viewed       browsing history                                  [boolean]
      --videos       download my videos                                [boolean]
      --numdl        number of concurrent downloads                     [number]
  -a, --all          extract all                                       [boolean]
  -v, --verbose      Show progress                                     [boolean]
  -h, --help         Show help                                         [boolean]
```

## Todo

- [ ] purchase history
- [ ] favorite hashtags
- [ ] ...
