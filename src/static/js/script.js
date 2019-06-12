function init(){
    reformAlbumTitle()
    document.querySelector('.albums-list').addEventListener('scroll', highlightAlbum)
    highlightAlbum()
}

function reformAlbumTitle(){
    const allAlbumTitle = Array.from(document.querySelectorAll('.albums-item h4.albums-name'))
    allAlbumTitle.forEach(title=>{
        const reformTitle = title.textContent.slice(0,23) + "..."
        if(title.textContent.length >= 23)  title.textContent = reformTitle
    })
}

function highlightAlbum(){
    const albums = Array.from(document.querySelectorAll('.albums-item'))
    const parentOffset =  document.querySelector('.albums-list').scrollLeft
    
    albums.forEach(album=>{
        const min = (album.offsetLeft-40)
        album.classList.remove('highlight')
        if(parentOffset>=min && parentOffset <= max){
            album.classList.add('highlight')
        }
    })
}

window.addEventListener('click', highlightAlbum)

window.addEventListener('load', init)