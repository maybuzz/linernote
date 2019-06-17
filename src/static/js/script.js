let headerIndex = 0;


function init(){
    reformAlbumTitle()
    document.querySelector('.albums-list').addEventListener('scroll', albumScrollCheck)
    albumScrollCheck()
    document.querySelectorAll('.navigation a').forEach(anchor=>anchor.addEventListener('click', activateLink))
    setHeaderPage()
    document.querySelector('.click-left-overlay').addEventListener('click', switchHeaderPage)
    document.querySelector('.click-right-overlay').addEventListener('click', switchHeaderPage)
}
 

function switchHeaderPage(){
    console.log(this)
    if(this.classList[0].includes('right')){
        if(headerIndex===2) return
        headerIndex++
        setHeaderPage()
    }else{
        if(headerIndex===0) return
        headerIndex--
        setHeaderPage()
    }
}
function setHeaderPage(){
    const activeI = Array.from(document.querySelectorAll('nav.header i'))
    const headerPages = Array.from(document.querySelectorAll('.header-section'))
    headerPages.forEach(p=>p.classList.remove('visible'))
    headerPages[headerIndex].classList.add('visible')

    activeI.forEach(p=>p.classList.remove('visible'))
    activeI[headerIndex].classList.add('visible')
    setBottomShadow()
}

function setBottomShadow (){
    const shadow = document.querySelector('.bottom-shadow')
    if(headerIndex===0){
        shadow.removeAttribute('style')
    }
    else{
        shadow.style.height = '20%'
    }
}


function activateLink(){
event.preventDefault()
// fetch(a.href)
console.log(this.href)
fetch(this.href)
    .then(html=>html.text())
    .then(body=>{
        if(document.querySelector('main')){
            document.body.removeChild(document.body.querySelector('main'))
            document.body.insertAdjacentHTML('beforeend', body)
            if(this.href.includes('instagram'))   instaIframe()
            if(this.href.includes('soundcloud'))  soundCloudSDK()
        }else{
            document.body.insertAdjacentHTML('beforeend', body)
        }
    })
}
 
function soundCloudSDK(){
    const el = document.getElementById('putTheWidgetHere')
    const url = el.getAttribute('data-url')
    SC.oEmbed(url, {
        element: document.getElementById('putTheWidgetHere')
    });
}
function instaIframe(){
    console.log('processing')
    instgrm.Embeds.process()
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
 
 