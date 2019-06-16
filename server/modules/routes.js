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
  // console.log(acces_token);
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

  const data = await getDataWithToken(config)
  const events_url    = `https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=${filterOutChar(data.name)}&countryCode=NL&apikey=${process.env.TICKETMASTER_CONSUMER_KEY}`
  const events        = await getData(events_url)
  const related = await getDataWithToken(config_related)
  const albums = await getDataWithToken(config_albums)
  
  const filterOUt = events._embedded.attractions.filter(item=>item.name.trim().toLowerCase()===data.name.trim().toLowerCase())
  const ticketResults = filterOUt[0] ? filterOUt[0] : filterOUt
  console.log(ticketResults)
  const musicbrainzId = await findArtistId(data.name)
  // console.log(musicbrainzId)
  const relatedMedia  = await getRelatedLinks(musicbrainzId.artists[0].id)
  // console.log(relatedMedia)
  
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
        // console.log(type) 
        type[Object.keys(type)[0]].push(media)
        // typesArray.push(type)
        // console.log('pushing')
      }
    })
    // console.log(Object.keys(type)[0])
  })
  tempArray = typesArray
  console.log(tempArray)
  // res.send(typesArray)
  // NOTE: ER IS EEN NIEUWE EN MAKKELIJKERE MANIER OM DATA UIT YOUTUBE TE HALEN BEKIJK DE CODE IN DE ROUTER >>>'/artist/:id/youtube'
  req.session.artist = {
    name: data.name,
    youtube: 'iets' 
  }
  // console.log(req.session.artist)
  res.render('artist', {
    data: data, 
    related: related, 
    albums: albums.items
  })
})

function arrayOrNot(someVar){
  if( Object.prototype.toString.call( someVar ) === '[object Array]' ) {
    return true
  }else{   
    return false
  }
}

router.get('/artist/:id/youtube', async (req,res)=>{
  // const scrape = await scrapeVideos(req.session.artist.youtube)
  const yt = new Youtube()
  yt.setKey("AIzaSyBeiiNR-feYHP2uC90LKZWVFlGx7IQ9ztE")
  yt.search(req.session.artist.name,10,(err,response) => {
    const data = response.items
      .filter(i=>i.id.videoId)
      .map(i=>i.id.videoId)
    // console.log(data)
    res.render('artist-media-partials/youtube', {data})
  });
})


router.get('/artist/:id/soundcloud', async (req,res)=>{
  console.log(tempArray)
  tempArray.forEach(item=>{
    // console.log(item)
    // console.log(Object.keys(item))
    if(Object.keys(item)[0]==='soundcloud'){
      const url = item[Object.keys(item)[0]][0].url.resource
      res.render('artist-media-partials/soundcloud', {url})
    }
  })
})

router.get('/artist/:id/instagram', (req,res)=>{
  // console.log(tempArray)
  tempArray.forEach(async (item)=>{
    // console.log(item)
    // console.log(Object.keys(item))
    if(Object.keys(item)[0]==='socialnetwork'){
      // console.log(item)
      const url = item.socialnetwork
        .filter(i=>i.url.resource.includes('instagram'))
        .map(x=>x.url.resource)[0]
      const links = await instaScraper(url)
      // links.forEach(async (link)=>{
      //   const api = await fetch(`https://api.instagram.com/oembed/?url=${link}`)
      //   const json = await api.json()
      //   console.log(json)
      // }) 
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



// findArtistId('Michael Jackson')
// Info from musicBrainnnzzzz
async function findArtistId(artist){
  // console.log(artist)
  const url = `http://musicbrainz.org/ws/2/artist/?query=artist:${artist}&fmt=json`
  const data = await getData(url)
  return data
}

async function musicBrainzAPI(id){
  // const nirvana = '5b11f4ce-a62d-471e-81fc-a69a8278c7da'
  const url = `http://musicbrainz.org/ws/2/artist/${id}?inc=url-rels&fmt=json`
  const data = await getData(url)
  return data
}

async function getRelatedLinks(id){
  // const artistId = await findArtistId(artist)
  // console.log(artistId)
  // const getSpecifik = artistId.artists
  //   .filter(d=>d.name === artist)
  // const id = getSpecifik[0].id
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
      // .filter(onlyUnique)

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