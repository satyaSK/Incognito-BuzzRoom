const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const  {generateMessage,generateLocation} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

//initialize Models
//initialize Routes
PORT = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)

count = 0

const PATH = path.join(__dirname,"../public")
app.use(express.static(PATH))

io.on("connection",(socket)=>{
    //console.log("New Web Socket")
    welcome_message = "Welcome to chat app!"
    // socket.emit('message', generateMessage(welcome_message))
    // socket.broadcast.emit('message','A new user has joined')

    socket.on('join', ({ username , room , peerId},callback) =>{
        const {error, new_user} = addUser({id:socket.id, username, room})
        socket.peerName = peerId // for video
        if(error){
            return callback(error)
        }
        console.log(new_user.username)
        socket.join(new_user.room)
        socket.emit('message', generateMessage(`Hi ${username}, Welcome to your private room: ${new_user.room}`))
        socket.broadcast.to(new_user.room).emit('message',generateMessage(`${new_user.username} has joined your room`))
        socket.broadcast.to(new_user.room).emit('user-connected', peerId)
        io.to(new_user.room).emit("roomDataUpdate",{
            room: new_user.room,
            users:getUsersInRoom(new_user.room)
        })

        callback()//calling cb wihout arguments --> without errors --> allows cliet to know if error or no error
    })
    
    
    socket.on('sendMessage',(msg, callback)=>{
        user = getUser(socket.id)
        message = msg
        io.to(user.room).emit('message',generateMessage(user.username, message))
        callback(message)//acknowledging
    })


    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)

        if (user){
            io.to(user.room).emit("user-disconnected", socket.peerName)
            io.to(user.room).emit('message',generateMessage(`${user.username} has disconnected!`))
            io.to(user.room).emit("roomDataUpdate",{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })


    socket.on('sendLocation',(location,cb)=>{
        user = getUser(socket.id)
        url = `http://google.com/maps?q=${location.lat},${location.lon}`
        //io.emit('message', url)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,url))
        console.log(generateLocation(user.username,url))
        cb()
    })

    // socket.emit('countUpdated', count)//(emit custom event, send data via all the other params)
    // socket.on('increase', ()=>{
    //     count++
    //     //socket.emit("countUpdated", count) //emits to single connection
    //     io.emit("countUpdated", count)
    // })
})

server.listen(PORT,()=>{
    console.log("Server live at Port:",PORT)
})