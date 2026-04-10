//ROUTES
import express from "express";
import { validateRequest} from "./user.validation.js"
import { getController, postController, putController, deleteController } from "./user.controllers.js";
const router = express.Router();

router.get("/", getController);
router.post("/", postController);
router.put("/", putController);
router.delete("/", deleteController);

/* //request validation with zod 
import {userSchema} from "./user.schema.js"
router.get("/", validatRequest(userSchema2), getController)
*/

export default router;
