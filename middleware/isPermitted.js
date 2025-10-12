import jwt from 'jsonwebtoken'


const isAuthenticated=async(req,res,next)=>{

  
try {
   const token= req.headers.authorization.split(" ")[1]
 await jwt.verify(token,process.env.JWT_SECRET)
  next()
} catch (error) {
  console.log(error)
  res.json({ok:false,message:`from isAuthenticated:${error.message}`})
  
}
}


export default isAuthenticated;