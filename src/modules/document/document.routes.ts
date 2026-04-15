//ROUTES
import express from "express";
import { validateRequest} from "./feature.validation.js"
import { getController, postController, putController, deleteController } from "./feature.controller.js";
const router = express.Router();

router.get("/", getController);
router.post("/", postController);
router.put("/", putController);
router.delete("/", deleteController);

/* //request validation with zod 
import {featureSchema} from "./user.schema.js"
router.get("/", validatRequest(featureSchema), getController)
*/

export default router;
