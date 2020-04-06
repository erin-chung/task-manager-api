const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res)=> {
    const match = {}
    const sort = {}

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(":")
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 //defining key value pair for sort object e.g. sort = { "createdAt" : "desc"}
    }

    if(req.query.completed){
        match.completed = req.query.completed === "true" //return true if string says 'true'
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req,res)=>{
    try {
        const _id = req.params.id
        const task = await Task.findOne({ _id, owner: req.user._id })
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.post('/tasks', auth, async (req,res) => {
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body, //(...) operator means req.x = req.body.x, req.y= req.body.y
        owner: req.user._id
    })
    
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req,res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send("Invalid updates")
    }

    try {  
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})
        if(!task) return res.status(404).send()
        
        updates.forEach( (update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if(!task) return res.status(404).send()
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router