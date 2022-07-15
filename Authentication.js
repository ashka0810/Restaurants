const jwt=require('jsonwebtoken');

module.exports=function(req,res,next)
{
    const token=req.header('token');
    if(!token)
    res.status(401).send('Access Denied');

    try{
        
        const verifytoken=jwt.verify(token,process.env.ACCESS_TOKEN);
        next();
    }
    catch(err){
        res.status(400).send('Invalid token');
    }
}