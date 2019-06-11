const fetch = require('node-fetch')

function getDataWithToken({acces_token, url}){
    return fetch(url,
    {
        headers:
        {
        'Authorization': 'Bearer ' + acces_token
        }
    })
        .then(response=> response.json())
}

function getData(url){
    return fetch(url)
        .then(response=> response.json())
}

function filterOutChar(string){
    return string.trim()
}
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
module.exports = {getDataWithToken, getData, filterOutChar, onlyUnique}
