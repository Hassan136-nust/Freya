const {Router} = require ("express");

const userController = require("../controllers/user.controller");
const {body} = require ("express-validator");

const {authUser} = require ("../middleware/auth.middleware")

const router = Router();

router.post("/register",
    body('email').isEmail().withMessage("Email must be valid"),
    body("password").isLength({min:3}).withMessage("Password should be atleast 3 chars"),
    userController.createUserController
)

router.post("/login",
    body('email').isEmail().withMessage("Email must be valid"),
    body("password").isLength({min:3}).withMessage("Password should be atleast 3 chars"),
    userController.loginController
)

router.get("/profile",authUser,userController.profileController); 

router.get("/logout",authUser,userController.logoutController)
  
router.get("/all",authUser,userController.getAllUsersController)


module.exports = router