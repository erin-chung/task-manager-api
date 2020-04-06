const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task') //not needed for virtual but needed for 'remove'


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)){
               throw new Error("Email is invalid.")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value<0) {
                throw new Error('Age must be a positive number.')
            }
        }
    }, 
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Password cannot contain 'password'.")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//virtual = relationship  (NOT really stored in database; just for mongoose to treat it as if it were)
userSchema.virtual('tasks', {
    ref: 'Task', //name of model it forms relationship with
    localField: '_id',   //user stores user id as _id
    foreignField: 'owner'  //task stores user id as owner
})

//methods = available on instances (user)
userSchema.methods.toJSON = function () { //toJSON is automatically called when object is stringified into readable format
    const user = this
    const userObject = user.toObject() //returns a cloned object (that we can alter without altering database)
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject //whenever we stringify for reading purposes, we return the altered clone, not the real user object in DB
}
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()}, process.env.JWT_SECRET, {expiresIn: '7 day'})
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

//statics = available on models (User)
userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne( { email } )

    if(!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error ("Unable to login")
    }

    return user
}

//Hash the plain text password before saving
userSchema.pre('save', async function(next){
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User