const express                 = require('express')
const Youtube                 = require('youtube-node')
const router                  = express.Router()
const {getDataWithToken}      = require('./helper')
const {getData}               = require('./helper')
const {filterOutChar}         = require('./helper')
const {onlyUnique}            = require('./helper')
const {removeALlSpaces}       = require('./helper')
const fetch                   = require('node-fetch')
let tempArray                 = null
const puppeteer = require('puppeteer');
router.get('/', (req,res)=>{
    res.render('login')
})

router.get('/home', (req, res) => {
  const data = []
  res.render('index', {data})
})

router.post('/home', async (req, res) => {
	const searchVal = req.body.search
	const acces_token = req.session.acces_token
	const config = {
				url: `https://api.spotify.com/v1/search?q=${searchVal}&type=artist&limit=5&offset=0`,
				acces_token
			}

	const data = await getDataWithToken(config)

	res.render('index', {
		data: data.artists.items
	})
})

router.get('/artist', async (req, res) => {
  res.render('artist', {data})
})

// id uit url halen
// id zoeken in api = koppelen aan artiest
// data inladen
router.get('/artist/:id', async (req, res) => {
	const searchVal = req.params.id
	const acces_token = req.session.acces_token

	// All the configurations for the spotify Calls
	const config = {
		url: `https://api.spotify.com/v1/artists/${searchVal}`,
		acces_token
	}
	const config_related = {
		url: `https://api.spotify.com/v1/artists/${searchVal}/related-artists`,
		acces_token
	}
	const config_albums = {
		url: `https://api.spotify.com/v1/artists/${searchVal}/albums?include_groups=album`,
		acces_token
	}
	
	// Get the general data of a an artist in via the Spotify api
	const data = await getDataWithToken(config)
	const config_topTracks = {
		url: `https://api.spotify.com/v1/artists/${data.id}/top-tracks?country=NL`,
		acces_token
	}

	// Get realted links via musicbrainz
	const musicbrainzId = await findArtistId(data.name)
	const relatedMedia  = await getRelatedLinks(musicbrainzId.artists[0].id)
	
	// Make for each type of relatedmedia their own object
	const uniqueTypes = [...new Set(relatedMedia.map(item => item.type))];
	const typesArray = uniqueTypes
		.map(type=>{
			return {
				[removeALlSpaces(type)]:[]
			}
		})
		typesArray.forEach(type=>{
			relatedMedia.forEach(media=>{
				if(removeALlSpaces(media.type) === Object.keys(type)[0]){
					type[Object.keys(type)[0]].push(media)
				}
			})
		})
	tempArray = typesArray

	// Get artist id from ticketmaster
	const attraction_url      = `https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=${filterOutChar(data.name)}&countryCode=NL&apikey=${process.env.TICKETMASTER_CONSUMER_KEY}`
	const artist_ticketMaster = await getData(attraction_url)
	const filterOUt           = artist_ticketMaster._embedded.attractions.filter(item=>item.name.trim().toLowerCase()===data.name.trim().toLowerCase())
	const ticketResults       = filterOUt[0] ? filterOUt[0] : filterOUt
	
	// Events from a specifc artist from ticketmaster api
	const events_url          = `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${ticketResults.id}&countryCode=NL&apikey=${process.env.TICKETMASTER_CONSUMER_KEY}`
	const artist_events       = await (await getData(events_url))._embedded

	// Spotfy data from spotify api
	const albums              = await (await getDataWithToken(config_albums)).items
	const related             = await getDataWithToken(config_related)
	const topTracks           = await getDataWithToken(config_topTracks)
	
	// Wikipedia data
	const wikiData            = await getWikiData(data.name, typesArray)

	// Instagram Data
	const instagramMeta       = instagramUrl(typesArray,'instagram')
	const instaData 	      = await getInstaEmbeds(instagramMeta)
	const instagram			  = []
	for(let insta of instaData){
		instaObj = {
			name: 	insta.author_name,
			url: 	insta.author_url,
			html:   insta.html
		}
		instagram.push(instaObj)
	}
	
	// How to test the data?
	// Uncomment the res.send line below
	// THe data will be send tot the client
	// In the client type the next lines in your console:
	// const data = JSON.parse(document.body.innerText)
	// data
	// ___________________________________________________
	// res.send({topTracks, albums, artist_ticketMaster, ticketResults, artist_events, related, wikiData, typesArray, instagram, instaData})

	// NOTE: ER IS EEN NIEUWE EN MAKKELIJKERE MANIER OM DATA UIT YOUTUBE TE HALEN BEKIJK DE CODE IN DE ROUTER >>>'/artist/:id/youtube'
	req.session.artist = {
		name: data.name,
		youtube: 'iets' 
	}
	// Youtube 
	const yt = new Youtube()
	yt.setKey("AIzaSyBeiiNR-feYHP2uC90LKZWVFlGx7IQ9ztE")
	yt.search(req.session.artist.name,10,(err,response) => {
		const youtube = response.items
		.filter(i=>i.id.videoId)
		.map(i=>{
			return {
			id:i.id.videoId,
			date: i.snippet.publishedAt
			}
		})
		// res.send(response)
		res.render('artist', {
		  data: data, 
		  related: related, 
		  albums: albums,
		  topTracks: topTracks.tracks,
		  wikiData,
		  youtube,
		  artist_events,
		  instagram
		})
	});
	// console.log(req.session.artist)
})

function arrayOrNot(someVar){
	if( Object.prototype.toString.call( someVar ) === '[object Array]' ) {
		return true
	}else{   
		return false
	}
}

router.get('/artist/:id/youtube', async (req,res)=>{
})


router.get('/artist/:id/soundcloud', async (req,res)=>{
	tempArray.forEach(item=>{
		if(Object.keys(item)[0]==='soundcloud'){
		const url = item[Object.keys(item)[0]][0].url.resource
		res.render('artist-media-partials/soundcloud', {url})
		}
	})
})

router.get('/artist/:id/instagram', (req,res)=>{
	tempArray.forEach(async (item)=>{
		if(Object.keys(item)[0]==='socialnetwork'){
		const url = item.socialnetwork
			.filter(i=>i.url.resource.includes('instagram'))
			.map(x=>x.url.resource)[0]
		const links = await instaScraper(url)
		const getEmbed = links.map(async(link)=>{
			const api = await fetch(`https://api.instagram.com/oembed/?url=${link}`)
			const json = await api.json()
			return json.html
		})
		const embeds = await Promise.all(getEmbed) 
		res.render('artist-media-partials/instagram', {embeds})
		}
	})
})

async function getWikiData(name, array){
	const wikiUrl1 = array
	.filter(t=>Object.keys(t)[0]==='wikipedia')
	const wikiUrl2 = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${name}`)).json()
	let wikiData = null
	if(wikiUrl1.length===0){
		wikiData = wikiUrl2.extract
	}else{
		const url = wikiUrl1[0].wikipedia[0].url.resource.split('https://en.wikipedia.org/wiki/')[1]
		wikiData =  await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${url}`)).json()
		wikiData = wikiData.extract
	}
	return wikiData
}

// async function instagramData(array){
//   tempArray.forEach(async (item)=>{
//     if(Object.keys(item)[0]==='socialnetwork'){
//       const url = item.socialnetwork
//         .filter(i=>i.url.resource.includes('instagram'))
//         .map(x=>x.url.resource)[0]
//       const links = await instaScraper(url)
//       const getEmbed = links.map(async(link)=>{
//         const api = await fetch(`https://api.instagram.com/oembed/?url=${link}`)
//         const json = await api.json()
//         return json.html
//       })
//       const embeds = await Promise.all(getEmbed) 
//     }
//   })
// }

function instagramUrl(array, social){
	const socialnetworks = array.filter(item=>{
		if(Object.keys(item)[0]==='socialnetwork'){
		return item
		}
	})
	const socialnetwork = socialnetworks[0].socialnetwork.filter(item=>{
		if(item.url.resource.includes(social))	return item
	})
	return socialnetwork[0].url.resource
}

async function getInstaEmbeds(url){
	const links = await instaScraper(url)
	const getEmbed = links.map(async(link)=>{
        const api = await fetch(`https://api.instagram.com/oembed/?url=${link}`)
        const json = await api.json()
        return json
	})
	const embeds = await Promise.all(getEmbed)
	return embeds 
}




// findArtistId('Michael Jackson')
// Info from musicBrainnnzzzz
async function findArtistId(artist){
	const url = `http://musicbrainz.org/ws/2/artist/?query=artist:${artist}&fmt=json`
	const data = await getData(url)
	return data
}

async function musicBrainzAPI(id){
	const url = `http://musicbrainz.org/ws/2/artist/${id}?inc=url-rels&fmt=json`
	const data = await getData(url)
	return data
}

async function getRelatedLinks(id){
	const getLinks = await musicBrainzAPI(id)
	return getLinks.relations
}


async function scrapeVideos(url){
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto(url)
	const allA = await page.evaluate(()=>{
		let elements = Array.from(document.querySelectorAll('a'))
		let links = elements
		.map(el=>el.href)
		.filter(el=>el.includes("watch?"))
		.filter(el=>!el.includes("list"))
		return links
	})
	await browser.close()
	return allA
	}

async function instaScraper(url){
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto(url)
	const allA = await page.evaluate(()=>{
		let elements = Array.from(document.querySelectorAll('article a'))
		let links = elements
		.map(el=>el.href)

		return links
	})
	console.log(allA)
	await browser.close()
	return allA
}


async function scrapeVideos2(query){
	const url = `https://www.youtube.com/results?search_query=${query}`
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	await page.goto(url)
	const allA = await page.evaluate(()=>{
		let elements = Array.from(document.querySelectorAll('a'))
		let links = elements
		.map(el=>el.href)
		.filter(el=>el.includes("watch?"))
		.filter(el=>!el.includes("list"))
		return links
	})
	await browser.close()
	return allA
}


module.exports = router