const jwt=require('jsonwebtoken')
var localStorage = require('local-storage');

module.exports = function(req, res, next) {
 
    
   
     
    const adminToken=localStorage.get('adminToken');

    if(!adminToken){
        res.redirect('/loginadmin')
    }
    else{
       
        next()
    }
    
    
}