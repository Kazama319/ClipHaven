import {Router} from 'express';
import {loginUser, logoutUser, refreshtoken, registerUser, updateUserAvatar, updateUserCoverImage} from '../controllers/user.controller.js';
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
    router.route("/change-avatar").post(
        upload.fields( [
            {
                name: "avatar",
                maxCount: 1
            }
        ]),
        updateUserAvatar
    )
    router.route("/change-cover-image").post(
        upload.fields( [
            {
                name: "coverImage",
                maxCount: 1
            }
        ]),
        updateUserCoverImage
    )
    router.route("/login").post(loginUser);
    router.route("/logout").post(verifyJWT,logoutUser);
    router.route("/refresh-token").post(refreshtoken);
    


export default router;