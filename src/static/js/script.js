function init(){
    reformAlbumTitle()
    document.querySelector('.albums-list').addEventListener('scroll', albumScrollCheck)
    albumScrollCheck()
    document.querySelectorAll('.navigation a').forEach(anchor=>anchor.addEventListener('click', activateLink))
}


function activateLink(){
    event.preventDefault()
    // fetch(a.href)
    console.log(this.href)
    fetch(this.href)
        .then(html=>html.text())
        .then(body=>{
            document.body.removeChild(document.body.querySelector('main'))
            document.body.insertAdjacentHTML('beforeend', body)
        })
}

function reformAlbumTitle(){
    const allAlbumTitle = Array.from(document.querySelectorAll('.albums-item h4.albums-name'))
    allAlbumTitle.forEach(title=>{
        const reformTitle = title.textContent.slice(0,23) + "..."
        if(title.textContent.length >= 23)  title.textContent = reformTitle
    })
}

function albumScrollCheck(){
    const albums = Array.from(document.querySelectorAll('.albums-item'))
    const parentOffset =  document.querySelector('.albums-list').scrollLeft
    albums.forEach(album=>{
        const min = (album.offsetLeft-40)
        const max = min + (album.offsetWidth-30)
        album.classList.remove('highlight')
        if(parentOffset>=min && parentOffset <= max){            
            album.classList.add('highlight')
        }
    })
}

// window.addEventListener('click', albumScrollCheck)

window.addEventListener('load', init)