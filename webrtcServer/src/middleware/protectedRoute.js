import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';

const protectRoute =async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({error: "Not Authorized- No Token"});
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({error: "Not Authorized- Invalid Token"});
        }
        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(401).json({error: "Not Authorized- User Not Found"});

        }
        req.user=user;
        next();


    } catch (error) {
        res.cookie("jwt","",{maxAge:0});
        console.log("Error in protectRoute middleware",error.message);
        res.status(500).json({error: "Session Expired. Please Login Again"});
    }
}
export default protectRoute;