const socket = io()

//elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')//defines location to render template
const invite = document.querySelector('#invite')
const members = {}


////////////////////////////////////////////////////
const turnOffVideo = document.getElementById('video-call')
const buzzvid = document.getElementById('buzzvideo')
const myVideo = document.createElement('video')
myVideo.muted = true
myVideo.setAttribute('height', '240');
myVideo.setAttribute('width', '325');
////////////////////////////////////////////////////

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML//define message template
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const  {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//video stuff/////////////////////////////////////////
// var peer = new Peer(undefined, {
//     host:'/',
//     port: 3001
// }); 

var peer = new Peer(undefined,{
    debug:2,
    proxied: true
}); 


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    addVideoStream(myVideo, stream)

    turnOffVideo.addEventListener('click', ()=>{
        turnOffVideo.setAttribute('disabled','disabled')
        stream.getTracks().forEach(track => track.stop())
        document.getElementById('buzzvideo').innerHTML = ''
    })

    
    peer.on('call', call => {
        call.answer(stream)
        const peerVid = document.createElement('video')
        peerVid.setAttribute('height', '240');
        peerVid.setAttribute('width', '325');
        call.on('stream', (peerVideoStream)=>{
            addVideoStream(peerVid, peerVideoStream)
        })
    })

    socket.on('user-connected', (userId)=>{
        connectToNewUser(userId, stream)
    })
})
 

function connectToNewUser(userId, stream){
    const call = peer.call(userId, stream)
    const peerVid = document.createElement('video')
    peerVid.setAttribute('height', '240');
    peerVid.setAttribute('width', '325');
    call.on('stream', (peerVideoStream)=>{
        console.log('Reeiving other user video stream')
        addVideoStream(peerVid, peerVideoStream)
    }, err =>{
        console.log(err)
    })

    call.on('close', ()=>{
        peerVid.pause()
        peerVid.src = ''
        peerVid.parentNode.removeChild(peerVid)
    })

    members[userId] = call
}


function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play()
    })
    buzzvid.append(video)
}
////////////////////////////////////////////////////


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(msg)=>{
    console.log(msg)
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message:msg.text,
        createdAt: moment(msg.createdAt).format("hh:mm")
    }) // takes in template and rendering items as argumrnt
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')

    message = e.target.elements.msg.value
    socket.emit('sendMessage', message, (message)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        console.log("Message sent successfully: ",message)//expecting this acknowledgement
    })
})


$sendLocationButton.addEventListener('click',()=>{
    
    if(!navigator.geolocation){
        return alert("Geolocation is not supported in your browser!")
    } 
    
    $sendLocationButton.setAttribute('disabled','disabled')
    
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position.coords)
        socket.emit("sendLocation", {
            lat:position.coords.latitude,
            lon:position.coords.longitude
        },()=>{
            console.log("Location sent successfully")
            $sendLocationButton.removeAttribute('disabled')
        })
        
    })

    
})


invite.addEventListener('click', ()=>{
    const invitation = window.location.href
    let randomName = Math.random().toString(36).substring(7)
    var invite = invitation.replace('username='+username, 'username='+randomName)

    const inviteMessage = 'Hello! I would like to invite you to join the meetup using this invitation link: ' + invite

    navigator.clipboard.writeText(inviteMessage)
    .then(()=>{
        console.log("invitation copied successfully")
        document.querySelector('#invite').innerHTML = "Invite Copied!"
        setTimeout(()=>{
            document.querySelector('#invite').innerHTML = "Generate Invite"
        }, 1200)
        
    })
    .catch(()=>{
        console.log("invitation copied failed")
    })
    
})


socket.on('locationMessage',(url)=>{
    console.log(url.url)
    const html = Mustache.render(locationTemplate,{
        username:url.username,
        location_link:url.url,
        created: moment(url.time).format("hh:mm")
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on("roomDataUpdate",({room,users})=>{
    const html = Mustache.render(sideBarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


socket.on("user-disconnected", (peerId)=>{
    console.log("disconnected:",peerId)
    if (members[peerId]) members[peerId].close()
})


peer.on('open', (peerId)=>{
    console.log("peer.id", peerId)
    socket.emit('join', {username,room, peerId},(error)=>{
        if(error){
            alert(error)
            location.href = '/'
        }
    })
})
// socket.emit('join', {username,room},(error)=>{
//     if(error){
//         alert(error)
//         location.href = '/'
//     }
// })



// 23rd April 2021
// $ heroku git:clone -a satya-incognito-buzzroom
// $ cd satya-incognito-buzzroom


// $ git add .
// $ git commit -am "make it better"
// $ git push heroku master