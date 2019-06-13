const express             = require('express')
const Youtube                  = require('youtube-node')
const router              = express.Router()
const {getDataWithToken}  = require('./helper')
const {getData}           = require('./helper')
const {filterOutChar}     = require('./helper')
const {onlyUnique}        = require('./helper')

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
  console.log(acces_token);
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
  console.log('##############################events' ,events)
  const filterOUt = events._embedded.attractions.filter(item=>item.name.trim().toLowerCase()===data.name.trim().toLowerCase())
  console.log(filterOUt)
  // let youtube = filterOUt[0].externalLinks ? filterOUt[0].externalLinks.youtube[0].url : null 
  // if(filterOUt[0].externalLinks){
  //   filterOUt[0].externalLinks.youtube[0].url
  // }else{
  //   null
  // }
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
  yt.search("anouk",1,(err,response) => {
    console.log(response)
    res.send(response)
  });

  // const urls =  scrape
  //   .filter(onlyUnique)
  //   .map(i=>i.split('watch?v=')[1])
})





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



async function test(){
  const iets = await scrapeVideos2('krezip')
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