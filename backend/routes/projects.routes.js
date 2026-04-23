const { Router } = require("express");
const { body } = require("express-validator");
const projectController = require("../controllers/project.controller");

const { authUser } = require("../middleware/auth.middleware");
const router = Router();

router.post('/create',
    authUser,
    body('name').isString().withMessage("Name is required"),
    projectController.createProject
)

router.get("/all",
    authUser,
    projectController.getAllProject
)

router.put("/add-user",
    authUser,
    body('projectId').isString().withMessage("Must be a string"),
    body('users').isArray({ min: 1 }).withMessage("users must be an array").bail()
    .custom((users) => users.every(user => typeof user === 'string')).withMessage("Each user must be string"),
    projectController.addUserToProject
)

router.get("/get-project/:projectId",
    authUser,
    projectController.getProjectById
)

module.exports = router;