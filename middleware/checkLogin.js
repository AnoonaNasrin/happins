module.exports = {
   
    checkLogin( req,res,next ){
        if( req.session.user == true){
               next()
        }else{
            res.redirect('/login')
        }

    },
    adminLogin(req , res , next){
        if (req.session.admin == true) {
          next();
        } else {
          res.redirect("/admin/login");
        }
    },
}