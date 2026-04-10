//ROUTES
import express from "express";
import { validateJoiRequest, validateZodRequest} from "./user.middleware.js"
import { getController, postController, putController, deleteController } from "./user.controller.js";
const router = express.Router();

router.get("/", getController);
router.post("/", postController);
router.put("/", putController);
router.delete("/", deleteController);

/* //request validation with joi 
import {userSchema1} from "./user.schema.js"
router.get("/", validateJoiRequest(userSchema1), getController)
*/
/* //request validation with zod 
import {userSchema2} from "./user.schema.js"
router.get("/", validateZodRequest(userSchema2), getController)
*/

export default router;
