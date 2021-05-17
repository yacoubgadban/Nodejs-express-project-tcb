const mongoose = require('mongoose')
const Schema = mongoose.Schema

const blogsSchema =new Schema({
    
    id:{type:String,required:true},
    fname:{type: String , required: true} ,
    lname:{type: String , required: true} ,
    email:{type: String , required: true},
    title:{type: String , required: true} ,
    description:{type: String , required: true} ,
    imgurl:{type: String , required: true}     
},{timestamps:true})

const Blogs =mongoose.model('Blogs',blogsSchema)
module.exports = Blogs