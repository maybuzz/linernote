const express   = require('express')
const router    = express.Router()
const {getDataWithToken} = require('./helper')
const {getData} = require('./helper')

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
  const related = await getDataWithToken(config_related)
  const albums = await getDataWithToken(config_albums)

  res.render('artist', {data: data, related: related, albums: albums.items})
})

module.exports = router
