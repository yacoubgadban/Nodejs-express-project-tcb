const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/user')
const Blogs = require('./models/blogs')
const Admin = require('./models/admin')
const path = require('path')
const  indexRouter = require('./routes/index')


const bcrypt = require('bcrypt')  



//database
const dbURI = "mongodb+srv://****:****@cluster0.sxa4m.mongodb.net/programers?retryWrites=true&w=majority";
mongoose.connect(dbURI,{useNewUrlParser:true ,useUnifiedTopology:true})
.then((result)=>{console.log('***** Server and database connected ;) *****');
app.listen(3000)

})
.catch((err)=>{err.message})

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extends :true}))


//router



app.use('/',indexRouter)
app.use('/logout/:id',indexRouter)
app.use('/login',indexRouter)
app.use('/register',indexRouter)
app.use('/loginadmin',indexRouter)
app.use('/admin',indexRouter)
app.use('/admin/users',indexRouter)
app.use('/admin/users/update',indexRouter)
app.use('/admin/users/update/:id',indexRouter)
app.use('//admin/users/delete/:id',indexRouter)
app.use('/createblog',indexRouter)
app.use('/admin/create',indexRouter)
app.use('/home/user',indexRouter)
app.use('/user/update/:',indexRouter)
app.use('/user/blog/update/:',indexRouter)
//404 page
app.use((req,res)=>{
    res.status(404).render('404',{title:'Page not found'})
})

