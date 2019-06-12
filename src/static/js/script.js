function init(){
    reformAlbumTitle()
}

function reformAlbumTitle(){
    const allAlbumTitle = Array.from(document.querySelectorAll('.albums-item h4.albums-name'))
    const maxChar = 23
    allAlbumTitle.forEach(title=>{
        const reformTitle = title.textContent.slice(0,23) + "..."
        if(title.textContent.length >= 23)  title.textContent = reformTitle
    })

}
window.addEventListener('load', init)