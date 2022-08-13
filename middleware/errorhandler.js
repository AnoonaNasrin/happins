module.exports = {
    errorHandler: (err,req,res,next) => {
        console.log(err);
        res.render('error/500-page');
    }
}