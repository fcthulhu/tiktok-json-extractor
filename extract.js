const async = require("async")
const fs = require("fs")
const path = require("path")
const request = require("request")
const yargs = require("yargs")

/**
 * Quick n dirty TikTok data extractor by fCthulhu
 * a few ones are missing (don't have sample data)
 * distributed as is, make it yours ;-)
 */

const argv = yargs
.option('input',      { description: 'json file to parse',             type: 'string', alias: 'i' })
.option('output',     { description: 'output dir',                     type: 'string', alias: 'o' })
.default('o', 'output')
.option('blocked',    { description: 'blocked users',                  type: 'boolean' })
.option('chats',      { description: 'chat history',                   type: 'boolean', alias: 'c' })
.option('comments',   { description: 'written comments',               type: 'boolean' })
.option('connections',{ description: 'connections history',            type: 'boolean' })
.option('effects',    { description: 'favorite effects',               type: 'boolean' })
.option('favhash',    { description: 'favorite hashtags',              type: 'boolean' })
.option('sounds',     { description: 'favorite sounds',                type: 'boolean' })
.option('favvids',    { description: 'favorite vids',                  type: 'boolean' })
.option('followers',  { description: 'followers list',                 type: 'boolean' })
.option('following',  { description: 'following list',                 type: 'boolean' })
.option('hashtags',   { description: 'used hashtags',                  type: 'boolean' })
.option('likes',      { description: 'like list',                      type: 'boolean', alias: 'l' })
.option('searches',   { description: 'search history',                 type: 'boolean', alias: 's' })
.option('shares',     { description: 'shared vids list',               type: 'boolean' })
.option('viewed',     { description: 'browsing history',               type: 'boolean' })
.option('videos',     { description: 'download my videos',             type: 'boolean' })
.option('numdl',      { description: 'number of concurrent downloads', type: 'number'})
.option('all',        { description: 'extract all'                   , type: 'boolean', alias: 'a' })
.option('verbose',    { description: 'Show progress',                  type: 'boolean', alias: 'v' })
.help()
.alias('help', 'h')
.usage('Usage: $0 -i file.json')
.demandOption(['i', 'o'])
.argv

const sourceFile   = argv.input
const outDir       = argv.output
const verbose      = argv.verbose
const concurrentDL = argv.numdl || 1
const htmlHead     = '<html><body>'
const htmlFoot     = '</body></html>'

let main = async () => {
	if(verbose) console.log(`- Opening data file`)
	const data = JSON.parse(fs.readFileSync(sourceFile, { encoding: 'utf8', flags: 'r'}))

	if(!fs.existsSync(outDir)) {
		if(verbose) console.log(`- Creating ouptut dir ${outDir}`)
		fs.mkdirSync(outDir)
	}

	/**
	 * Blocked users
	 */
	 if(argv.blocked || argv.all) {
		const blockList = data['App Settings'].Block.BlockList
		let blockFile = path.join(outDir, 'blocked') + '.html'

		if(verbose) console.log(`  - Found ${blockList.length} blocked users`)

		fs.writeFileSync(blockFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		blockList.forEach((item) => {
			fs.writeFileSync(blockFile, `<li>${item.Date} : ${item.UserName}</li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(blockFile, '</ol>' + htmlFoot, { flag: 'a' }, err => { console.log(err) })
	 }


	/**
	 * User's chats
	 */
	if(argv.chats || argv.all) {
		const chatDir = path.join(outDir, 'chats')

		if(!fs.existsSync(chatDir)) {
			if(verbose) console.log(`  - Creating chats dir ${chatDir}`)
			fs.mkdirSync(chatDir)
		}

		const chatList = data['Direct Messages']['Chat History'].ChatHistory
		const keyList = Object.keys(chatList)

		if(verbose) console.log(`  - Found ${keyList.length} chats histories`)

		keyList.forEach ((key) => {
			let nick = key.replace('Chat History with ', '').replace(':', '')
			let chatFile = path.join(chatDir, nick) + '.txt'
			let chats = chatList[`Chat History with ${nick}:`]

			if(verbose) console.log(`  - Chats with ${nick} to ${chatFile}`)

			if(fs.existsSync(chatFile)) {
				fs.writeFileSync(chatFile, '', { flags: 'w' }, err => { console.log(err) })
				if(verbose) console.log(`    ${chatFile} already exists -> truncated…`)
			}

			chats.forEach((chat) => {
				fs.writeFileSync(chatFile, `${chat.Date} ${chat.From} >\t${chat.Content}\n`, { flag: 'a'}, err => { console.log(err) })
			})
		})
	}

	/**
	 * User's comments
	 */
	 if(argv.comments || argv.all) {
		const commList = data.Comment.Comments.CommentsList

		if(verbose) console.log(`  - Found ${commList.length} comments`)

		let commFile = path.join(outDir, 'comments') + '.txt'

		fs.writeFileSync(commFile, '', { flags: 'w' }, err => { console.log(err) })

		commList.forEach((comm) => {
			fs.writeFileSync(commFile, `${comm.Date} : ${comm.Comment}\n`, { flag: 'a'}, err => { console.log(err) })
		})
	 }

	/**
	 * Connections history
	 */
	 if(argv.connections || argv.all) {
		const connList = data.Activity['Login History'].LoginHistoryList

		if(verbose) console.log(`  - Found ${connList.length} connections`)

		let connFile = path.join(outDir, 'connections') + '.txt'

		fs.writeFileSync(connFile, 'Date\t\t\tIP\t\tDevice\t\tOS\t\tNetwork\tCarrier\n', { flags: 'w' }, err => { console.log(err) })

		connList.forEach((conn) => {
			fs.writeFileSync(connFile, `${conn.Date}\t${conn.IP}\t${conn.DeviceModel}\t${conn.DeviceSystem}\t${conn.NetworkType}\t${conn.Carrier}\n`, { flag: 'a'}, err => { console.log(err) })
		})
	 }

	/**
	 * Favorite Effects
	 */
	if(argv.effects || argv.all) {
		const effList = data.Activity['Favorite Effects'].FavoriteEffectsList

		if(verbose) console.log(`  - Found ${effList.length} effects`)

		let effFile = path.join(outDir, 'fav_effects') + '.html'

		fs.writeFileSync(effFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		effList.forEach((eff) => {
			fs.writeFileSync(effFile, `<li>${eff.Date} : <a href="${eff.EffectLink}">${eff.EffectLink}</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(effFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Favorite Sounds
	 */
	if(argv.sounds || argv.all) {
		const sndList = data.Activity['Favorite Sounds'].FavoriteSoundList

		if(verbose) console.log(`  - Found ${sndList.length} sounds`)

		let sndFile = path.join(outDir, 'fav_sounds') + '.html'

		fs.writeFileSync(sndFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		sndList.forEach((snd) => {
			fs.writeFileSync(sndFile, `<li>${snd.Date} : <a href="${snd.Link}">${snd.Link}</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(sndFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Favorite Videos
	 */
	if(argv.favvids || argv.all) {
		const vidList = data.Activity['Favorite Videos'].FavoriteVideoList

		if(verbose) console.log(`  - Found ${vidList.length} videos`)

		let vidFile = path.join(outDir, 'fav_videos') + '.html'

		fs.writeFileSync(vidFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		vidList.forEach((vid) => {
			fs.writeFileSync(vidFile, `<li>${vid.Date} : <a href="${vid.Link}">${vid.Link}</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(vidFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Followers
	 */
	if(argv.followers || argv.all) {
		const fanList = data.Activity['Follower List'].FansList

		if(verbose) console.log(`  - Found ${fanList.length} followers`)

		let fanFile = path.join(outDir, 'followers') + '.html'

		fs.writeFileSync(fanFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		fanList.forEach((fan) => {
			fs.writeFileSync(fanFile, `<li>${fan.Date} : ${fan.UserName}</li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(fanFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Following
	 */
	if(argv.following || argv.all) {
		const folList = data.Activity['Following List'].Following

		if(verbose) console.log(`  - Found ${folList.length} following`)

		let folFile = path.join(outDir, 'following') + '.html'

		fs.writeFileSync(folFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		folList.forEach((fol) => {
			fs.writeFileSync(folFile, `<li>${fol.Date} : ${fol.UserName}</li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(folFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Used hashtags
	 */
	if(argv.hashtags || argv.all) {
		const hasList = data.Activity.Hashtag.HashtagList

		if(verbose) console.log(`  - Found ${hasList.length} hashtags`)

		let hasFile = path.join(outDir, 'used_hashtags') + '.html'

		fs.writeFileSync(hasFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		hasList.forEach((has) => {
			fs.writeFileSync(hasFile, `<li><a href="${has.HashtagLink}">${has.HashtagName}</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(hasFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Liked list
	 */
	if(argv.likes || argv.all) {
		const likList = data.Activity['Like List'].ItemFavoriteList

		if(verbose) console.log(`  - Found ${likList.length} liked videos`)

		let likFile = path.join(outDir, 'likes') + '.html'

		fs.writeFileSync(likFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		likList.forEach((lik) => {
			fs.writeFileSync(likFile, `<li>${lik.Date} : <a href="${lik.VideoLink}">${lik.VideoLink}</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(likFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Search history
	 */
	if(argv.searches || argv.all) {
		const seaList = data.Activity['Search History'].SearchList

		if(verbose) console.log(`  - Found ${seaList.length} search terms`)

		let seaFile = path.join(outDir, 'searches') + '.html'

		fs.writeFileSync(seaFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		seaList.forEach((sea) => {
			fs.writeFileSync(seaFile, `<li>${sea.Date} : ${sea.SearchTerm}</li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(seaFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * Share history
	 */
	if(argv.shares || argv.all) {
		const shaList = data.Activity['Share History'].ShareHistoryList

		if(verbose) console.log(`  - Found ${shaList.length} shared links`)

		let shaFile = path.join(outDir, 'shares') + '.html'

		fs.writeFileSync(shaFile, htmlHead + '<ol>\n', { flags: 'w' }, err => { console.log(err) })

		shaList.forEach((sha) => {
			fs.writeFileSync(shaFile, `<li>${sha.Date} : <a href="${sha.Link}">${sha.Link} (${sha.Method})</a></li>\n`, { flag: 'a'}, err => { console.log(err) })
		})

		fs.writeFileSync(shaFile, '</ol>' + htmlFoot, { flag: 'a'}, err => { console.log(err) })
	}

	/**
	 * View history
	 */
	if(argv.viewed || argv.all) {
		const vieList = data.Activity['Video Browsing History'].VideoList

		if(verbose) console.log(`  - Found ${vieList.length} viewed videos`)

		let vieFile = path.join(outDir, 'views') + '.txt'

		fs.writeFileSync(vieFile, '', { flags: 'w' }, err => { console.log(err) })

		vieList.forEach((vie) => {
			fs.writeFileSync(vieFile, `${vie.Date}\t${vie.VideoLink}\n`, { flag: 'a'}, err => { console.log(err) })
		})
	}

	/**
	 * User's videos download
	 */
	if(argv.videos || argv.all) {
		if(verbose) console.log(`- Downloading Videos`)

		const vidDir = path.join(outDir, 'videos')
		if(!fs.existsSync(vidDir)) {
			if(verbose) console.log(`  - Creating videos dir ${vidDir}`)
			fs.mkdirSync(vidDir)
		}

		const videoList = data.Video.Videos.VideoList

		if(verbose) console.log(`  - Found ${videoList.length} videos`)

		const dlList = []

		videoList.forEach((vid) => {
			let videoName = path.join(vidDir, vid.Date.split(' ')[0] + '.mp4')

			if(!fs.existsSync(videoName)) {
				dlList.push({
					videoURL : vid.VideoLink,
					videoName : videoName
				})
			}
		})

		async.eachLimit(dlList,
			concurrentDL,
			(dl, cb) => {
				download(dl.videoURL, dl.videoName, cb)
			},
			(err) => {
				if(err) {
					console.log('        ' + err)
				} else {
					console.log('      Done')
				}
			})
	}
}

let download = (url, dest, cb) => {
    const sendReq = request.get(url)
	const file = fs.createWriteStream(dest)

	if(verbose) console.log(`      Downloading ${dest}`)

    // verify response code
    sendReq.on('response', (response) => {
    	switch (response.statusCode) {
    		case 200:
			    sendReq.pipe(file)
			    break;

			case 410:
		        try { fs.unlinkSync(dest) } catch(e) { }
		        if (verbose) console.log('        Error: doesn’t exist anymore')
		        return cb()
				break;

			case 403:
		        try { fs.unlinkSync(dest) } catch(e) { }
		        if (verbose) console.log('        Error: access denied')
		        return cb()
				break;

			default:
		        try { fs.unlinkSync(dest) } catch(e) { }
				if (verbose) console.log(`        Error: Response status was ${response.statusCode}`)
		        return cb()
    	}
    })

    // check for request errors
    sendReq.on('error', (err) => {
        try { fs.unlinkSync(dest) } catch(e) { }
        if (verbose) console.log('        Error: ${err}')
        return cb()
    })

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb))

    file.on('error', (err) => { // Handle errors
        try { fs.unlinkSync(dest) } catch(e) { }
        return cb(err.message)
    })
}

main()