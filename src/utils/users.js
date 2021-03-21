const users = []


const addUser = ({id,username,room})=>{

    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if(!username || !room){
        return {
            error: "Username & Room is required"
        }
    }

    const existingUser = users.find((user)=>{
        return user.username === username && user.room == room
    })

    if (existingUser){
        return {
            error:"Username already taken in that room!"
        }
    }

    const new_user = {id,username,room}
    users.push(new_user)
    return { new_user }
}

const removeUser = (id)=>{
    const index = users.findIndex((user)=>{
        return user.id === id
    })

    if(index!=-1){
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    const fetched_user = users.find((user)=> user.id === id)
    if(!fetched_user){
        return undefined
    }
    else{
        return fetched_user
    }
}

const getUsersInRoom = (room)=>{
    room = room.trim().toLowerCase()
    return users.filter((user)=> user.room===room)
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
