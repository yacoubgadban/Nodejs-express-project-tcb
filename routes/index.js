const Joi=require('joi');
const express = require('express');
const router = express.Router();
const User = require('./../models/user')
const Blogs=require('./../models/blogs')
const Admin = require('./../models/admin');
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcrypt')  
const jwt=require('jsonwebtoken')
const adminAuth=require('./../middleware/adminauth')
const { spawnSync } = require('child_process');
var localStorage = require('local-storage');
const { schema } = require('./../models/user');
const { error } = require('console');
const { invalid } = require('joi');

//////////upload image
//storage
const storage = multer.diskStorage({
    destination: './public/images/',
    
    filename:function(req,file,callback){
        callback(null, Date.now()+path.extname(file.originalname)) 
    } 
    
})
//init upload
const upload=multer({
    storage: storage
})

///////////////////////////////////////////////////////////////////////// register

//register page
router.get('/register',(req, res)=>{
    const joiError=localStorage.get('joiError')
    
   
    res.render('register',{title:'Register',joiError:joiError})
})


//register create user
router.post('/register',upload.single('image') ,async(req,res)=>{
     
        const schema =Joi.object({
            
            fname: Joi.string().alphanum().min(2).max(10).required(),
            lname: Joi.string().alphanum().min(2).max(10).required(),
            description: Joi.string().min(2).max(70).required(),
            email: Joi.string().min(6).max(30).email({ minDomainSegments: 2}).required(),
            password: Joi.string().min(6).max(20).required(),
            phone: Joi.string().min(9).max(15).required(),
            imgurl: Joi.string()
        })
       
    
        const  joiError = schema.validate(req.body)
        if(joiError.error){
            localStorage.set('joiError',joiError)
            localStorage.set('data',req.body)
            const data=localStorage.get('data')
               
            return  res.render('register',{title:"Register",joiError : joiError })
        }
        let user =await User.findOne({email : req.body.email})
        if(user){
            
             emailtaken="This email is already in system !"
             const messag = emailtaken;

             spawnSync("powershell.exe", [`
             Add-Type -AssemblyName PresentationCore,PresentationFramework;
             [System.Windows.MessageBox]::Show('${messag}');
             `]);
           return res.redirect('/register') 
        }else{
        const user= new User({
        fname:req.body.fname,
        lname:req.body.lname,
        description:req.body.description,
        email:req.body.email,
        password:req.body.password,
        phone:req.body.phone,
        imgurl:req.file.filename
        
    })
   

    const saltRounds=10;
    const salt=await bcrypt.genSalt(saltRounds)
    user.password=await bcrypt.hash(user.password,salt);
    localStorage.remove('joiError')

    user.save() 
    .then((result)=>{res.redirect('/login')})
    .catch((err)=>{res.redirect('/register')})


}
   
})

///////////////////////////////////////////////////////////////////////// login
//login page

router.get('/login',(req, res)=>{
    const joiError=localStorage.get('joiError')

    res.render('login',{title:'Login',joiError:joiError})
})


//login method
router.post('/login',async(req,res)=>{
    
    
    const schema =Joi.object({
        email: Joi.string().min(6).max(30).email({ minDomainSegments: 2}).required(),
        password: Joi.string().min(6).max(20).required(),
       
    })
   

    const  joiError = schema.validate(req.body)
    if(joiError.error){
        localStorage.set('joiError',joiError)
        localStorage.set('data',req.body)
        const data=localStorage.get('data')
           
         return res.render('login',{title:"login",joiError : joiError })
    }
    
    let user = await User.findOne({email:req.body.email})
      
    if(!user){
        invalidEmorpas="Email or password is invalid!"
             const messag = invalidEmorpas;
        spawnSync("powershell.exe", [`
             Add-Type -AssemblyName PresentationCore,PresentationFramework;
             [System.Windows.MessageBox]::Show('${messag}');
             `]);
       return res.redirect('/login')
    }
    else{

    const checkPassword=await bcrypt.compare(req.body.password ,user.password)
    if(!checkPassword){
        invalidEmorpas="Email or password is invalid!"
             const messag = invalidEmorpas;
        spawnSync("powershell.exe", [`
             Add-Type -AssemblyName PresentationCore,PresentationFramework;
             [System.Windows.MessageBox]::Show('${messag}');
             `]);
       return res.redirect('/login')
    }else{
        localStorage.remove('joiError')
        const token =jwt.sign({user:user._id}, 'privateKey');  
        localStorage.set(user._id , token);
         res.redirect('/homepage/'+""+user._id+"")

    } 
  }
})

////////////////////////////////////////////
/////////////logout
router.get('/logout/:id',async(req, res)=>{
    const id=req.params.id
    localStorage.remove(id)
    localStorage.remove('joiError')

    res.redirect('/')   
})
///////////////////////////////////////////////////// Home router

//home page
router.get('/',async(req, res)=>{
    localStorage.remove('joiError')
    let result=await User.find().sort({createdAt : -1,})
    let result2=await Blogs.find().sort({createdAt : -1,})
    res.render('home',{User:result,Blogs:result2,title:"Home"})
    
})


//home page
router.get('/homepage/:id',async(req, res)=>{
    const id=req.params.id
    localStorage.remove('joiError')

    const token=localStorage.get(id);
    

    if(!token){
        res.redirect('/login')
    }
    else{
        let user=await User.findById(id)
        let result=await User.find().sort({createdAt : -1,})
        let result2=await Blogs.find().sort({createdAt : -1,})
       
        res.render('userhome',{title:"Home",user:user,Blogs:result2,User:result})
        
    }

})

///////////////////////////////




////////////////////////////////////////////////////////////////////////////////   admin

//admin login page
router.get('/loginadmin',(req, res)=>{
    localStorage.remove('adminToken');
    const joiError=localStorage.get('joiErrorAdmin')
    res.render('loginadmin',{title:'Admin login',joiError:joiError})
})

//admin Page

router.get('/admin',adminAuth,(req, res)=>{
    localStorage.remove('joiErrorAdmin')
    res.render('admin',{title:'Admin'})
})

//login  admin 
router.post('/loginadmin',async(req, res)=>{
    const schema =Joi.object({
            
       
        email: Joi.string().min(6).max(30).email({ minDomainSegments: 2}).required(),
        password: Joi.string().min(6).max(20).required(),
      
    }) 
    const  joiError = schema.validate(req.body)
    if(joiError.error){
        localStorage.set('joiErrorAdmin',joiError)
        
        return  res.render('loginadmin',{title:'Admin login',joiError:joiError})
   
  }
   else{
   
    try{
        let email = req.body.email
        let admin =await Admin.findOne({email})
        
        if(admin.password==req.body.password){
            const adminToken =jwt.sign({admin:admin}, 'adminprivateKey'); 
            localStorage.remove('joiErrorAdmin')
 
            localStorage.set('adminToken', adminToken);  
           return res.render('admin',{title:'Admin'})  
             }else{
                localStorage.remove('joiErrorAdmin')

                const invalidEmorpas="Email or password is invalid!"
                const messag = invalidEmorpas;
                 spawnSync("powershell.exe", [`
                Add-Type -AssemblyName PresentationCore,PresentationFramework;
                [System.Windows.MessageBox]::Show('${messag}');
                `]);
           return res.redirect('/loginadmin') 
        }
    }catch(e){
        const invalidEmorpas="Email or password is invalid!"
        const messag = invalidEmorpas;
         spawnSync("powershell.exe", [`
        Add-Type -AssemblyName PresentationCore,PresentationFramework;
        [System.Windows.MessageBox]::Show('${messag}');
        `]);
       return res.redirect('/loginadmin') 
    }
}
 })
    

//admin create user page
router.get('/admin/create',adminAuth,(req, res)=>{
    const joiError=localStorage.get('joiErrorAdmin')

    res.render('admincreateuser',{title:'Create user',joiError: joiError})
})
//admin create user
router.post('/admin/create',adminAuth,upload.single('image'),async(req,res)=>{
   
    const schema =Joi.object({
            
        fname: Joi.string().alphanum().min(2).max(10).required(),
        lname: Joi.string().alphanum().min(2).max(10).required(),
        description: Joi.string().min(2).max(70).required(),
        email: Joi.string().min(6).max(30).email({ minDomainSegments: 2}).required(),
        password: Joi.string().min(6).max(20).required(),
        phone: Joi.string().min(9).max(15).required(),
        imgurl: Joi.string()
    })
   

    const  joiError = schema.validate(req.body)
    if(joiError.error){
        localStorage.set('joiErrorAdmin',joiError)
        localStorage.set('data',req.body)
        const data=localStorage.get('data')
           
        return  res.render('admincreateuser',{title:"Admin login",joiError : joiError })
    }
    let user =await User.findOne({email : req.body.email})
    if(user){
        
         emailtaken="This email is already in system !"
         const messag = emailtaken;

         spawnSync("powershell.exe", [`
         Add-Type -AssemblyName PresentationCore,PresentationFramework;
         [System.Windows.MessageBox]::Show('${messag}');
         `]);
       return res.redirect('/admin/create') 
    }else{
    const user= new User({
    fname:req.body.fname,
    lname:req.body.lname,
    description:req.body.description,
    email:req.body.email,
    password:req.body.password,
    phone:req.body.phone,
    imgurl:req.file.filename
    
})


const saltRounds=10;
const salt=await bcrypt.genSalt(saltRounds)
user.password=await bcrypt.hash(user.password,salt);
localStorage.remove('joiErrorAdmin')

user.save() 
.then((result)=>{res.redirect('/admin/users ')})
.catch((err)=>{res.redirect('/admin/create')})


}
    
})

//admin update page
router.get('/admin/users/update/:id',adminAuth,async(req, res)=>{
    const joiError=localStorage.get('joiErrorAdmin')

    const id=req.params.id
    await User.findById(id)
    .then((result)=>{res.render('adminuserupdate',{user:result,title:"Update user",joiError : joiError})})
    .catch((err)=>{res.redirect('/admin/users/update/:id')})
})

//admin update user
router.post('/admin/users/update/:id',adminAuth,async(req, res)=>{
     
    const id=req.params.id 
    const user=await User.findById(id)
     
        const schema =Joi.object({
            
            fname: Joi.string().alphanum().min(2).max(10).required(),
            lname: Joi.string().alphanum().min(2).max(10).required(),
            description: Joi.string().min(2).max(170).required(),
            phone: Joi.string().min(9).max(15).required(),
        })
       
        const  joiError = schema.validate(req.body)
        if(joiError.error){
            localStorage.set('joiErrorAdmin',joiError)
           
               
            return  res.render('adminuserupdate',{title:"Update user",user:user,joiError : joiError })
        } 
else{
    
    user.fname=req.body.fname
    user.lname=req.body.lname
    user.description=req.body.description
    user.phone=req.body.phone
    localStorage.remove('joiErrorAdmin')
    user.save()
    .then((result)=>{res.redirect('/admin')})
    .catch((err)=>{console.log(err)})
}   
   
})


//admin show users
router.get('/admin/users',adminAuth,async(req, res)=>{
    localStorage.remove('joiErrorAdmin')

    await User.find().sort({createdAt : -1,})
    .then((result)=>{res.render('admingetusers',{Users:result,title:"Users"})})
    .catch((err)=>{})
})




//admin delete user
router.get('/admin/users/delete/:id',adminAuth,async(req,res)=>{
    localStorage.remove('token');

    let id=req.params.id
    await User.findByIdAndDelete(id)
    res.redirect('/admin/users')       
})


//admin delete blog
router.get('/admin/blogs/delete/:id',adminAuth,async(req,res)=>{
    const id=req.params.id
    await Blogs.findByIdAndDelete(id)
    .then((result)=>{res.redirect('/admin/blogs')})
    .catch((err)=>{console.log(err)})
})
//////////////////////////////////////////////////////////////////////////////////////  admin blogs

//admin show blogs
router.get('/admin/blogs',adminAuth,async(req, res)=>{
    localStorage.remove('joiErrorAdmin')

    await Blogs.find().sort({createdAt : -1,})
    .then((result)=>{res.render('admingetblogs',{Blogs:result,title:"Users"})})
    .catch((err)=>{})
})
//////////////////////////////////////////////

///////////////////////////////////////////////////////////////////     blogs user

//create blog page
router.get('/createblog/:id',async(req, res)=>{
    const id=req.params.id

    const token=localStorage.get(id);
    
    if(!token){
        res.redirect('/login')

    }
    else{
        const joiError=localStorage.get('joiError')

    let user=await User.findById(id)
    res.render('createblog',{title:"Create blog",user:user,joiError : joiError})
    
    }
    
    
})
//create blog
router.post('/createblog/:id',async(req, res)=>{
    const id=req.params.id

    const token=localStorage.get(id);
    

    if(!token){
        res.redirect('/login')

    }
    else{


        const schema =Joi.object({
            
            
            title: Joi.string().min(2).max(20).required(),
            description: Joi.string().min(2).max(70).required(),
            
        })
       
        let user=await User.findById(id)
        const  joiError = schema.validate(req.body)
        if(joiError.error){
            localStorage.set('joiError',joiError)
            localStorage.set('data',req.body)
            const data=localStorage.get('data')
               
            return  res.render('createblog',{title:"Create blog",user:user,joiError : joiError })
        } 
       
    const blog=new Blogs(req.body)
    blog.fname=user.fname
    blog.lname=user.lname
    blog.email=user.email
    blog.id=user._id
    blog.imgurl=user.imgurl
    localStorage.remove('joiError')
    blog.save()
    res.redirect('/homepage/'+""+user._id+"")
        
    }   
    
})
//get blogs
router.get('/user/blogs/:id',async(req, res)=>{

    const id=req.params.id

    
    const token=localStorage.get(id);
    

    if(!token){
        res.redirect('/login')
    }
    else{
        localStorage.remove('joiError')

        const user=await User.findById(id)
        let blogs=await Blogs.find().sort({createdAt : -1,})
        res.render('usermanageblog',{title:"manage",user:user,blogs:blogs})  
        
    }
    
  
})
// user update blog page
router.get('/user/blog/update/:id/:id2',async(req, res)=>{
    const id=req.params.id
    const id2=req.params.id2
    const token=localStorage.get(id2);
    
    if(!token){
        res.redirect('/login')
    }
    else{

        
        const joiError=localStorage.get('joiError')

        const blog=await Blogs.findById(id)
    const user=await User.findById(id2)
    res.render('userupdateblog',{blog:blog,title:"Update blog",user:user,joiError : joiError})              
    }   
})


//user update blog
router.post('/user/blog/update/:id/:id2',async(req, res)=>{
    const id=req.params.id
    const id2=req.params.id2  
    const token=localStorage.get(id2);
    
    if(!token){
        res.redirect('/login')
    }
    else{   
        
        const schema =Joi.object({
            
            
            title: Joi.string().min(2).max(20).required(),
            description: Joi.string().min(2).max(70).required(),
            
        })
       
        const blog=await Blogs.findById(id)
        const user=await User.findById(id2)
        const  joiError = schema.validate(req.body)
        if(joiError.error){
            localStorage.set('joiError',joiError)
            localStorage.set('data',req.body)
            const data=localStorage.get('data')
               
            return  res.render('userupdateblog',{title:"Update blog",user:user,joiError : joiError,blog:blog })
        } 
        
        
        blog.title=req.body.title
        blog.description=req.body.description
        localStorage.remove('joiError')

        blog.save()
        .then((result)=>{res.redirect('/user/blogs/'+""+user._id+"")})
        .catch((err)=>{console.log(err)})
        
    }
       
})

//user delete blog
router.get('/user/blogs/delete/:id',async(req,res)=>{
    const id=req.params.id
    const token=localStorage.get(id);
    if(!token){
        res.redirect('/login')

    }
    else{  
        localStorage.remove('joiError')

        await Blogs.findByIdAndDelete(id)
        .then((result)=>{res.redirect('back')})
        .catch((err)=>{console.log(err)})
        
    }
  
})
////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////// user

//user update page
router.get('/user/update/:id',async(req, res)=>{
    const id=req.params.id

     
    const token=localStorage.get(id);
    

    if(!token){
        res.redirect('/login')

    }
    else{
       
        const user=await User.findById(id)
        const joiError=localStorage.get('joiError')

        res.render('userupdateprofile',{title:"Profile",user:user,joiError:joiError})

        
    }
   
})
//user update profile
router.post('/user/update/:id',async(req, res)=>{
    let id=req.params.id 
    const token=localStorage.get(id);
    if(!token){
        res.redirect('/login')

    }
    else{
      
        const schema =Joi.object({
            
            fname: Joi.string().alphanum().min(2).max(15).required(),
            lname: Joi.string().alphanum().min(2).max(15).required(),
            description: Joi.string().min(2).max(170).required(),
            phone: Joi.string().min(9).max(15).required(),
        })
       
        let user=await User.findById(id)
        const  joiError = schema.validate(req.body)
        if(joiError.error){
            localStorage.set('joiError',joiError)
            localStorage.set('data',req.body)
            const data=localStorage.get('data')
               
            return  res.render('userupdateprofile',{title:"Register",user:user,joiError : joiError })
        } 

    
   
    user.fname=req.body.fname
    user.lname=req.body.lname
    user.description=req.body.description
    user.phone=req.body.phone
    user.password=user.password
    localStorage.remove('joiError')

     user.save()
    .then((result)=>{res.redirect('/homepage/'+""+user._id+"")})
    .catch((err)=>{console.log(err)})
        
    }
   
})
/////////////////////////////////////////////////////////////////////   404
//404 page
router.use((req,res)=>{
    res.status(404).render('404',{title:'Page not found'})
})



module.exports = router