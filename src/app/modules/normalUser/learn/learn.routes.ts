import express from "express";
import auth from "../../../middlewares/auth";
import { learnController } from "./learn.controller";



const router = express.Router();

router.get(
  "/all-instructors",
  auth(),
  learnController.getAllInstructorsController
);

router.get(
  "/recent-search",
  auth(),
  learnController.getRecentSearchController
);

router.get("/search/instructors", auth(),learnController.searchInstructorsController);
router.get(
  "/by-skill/:skillId",
  auth(),
  learnController.getInstructorBySkillId
);

router.post('/send-offer', auth(), learnController.sendOrderOffer);

router.get('/pending-orders', auth(), learnController.getPendingOrders);

router.get('/paid-teaching-orders', auth(), learnController.getPaidTeachingOrders);

router.get("/instructor/:userId", auth(), learnController.getInstructorByUserIdController);

router.patch("/orders/respond/:orderId", auth(), learnController.respondToOrderController);

// Confirmed orders
router.get("/orders/confirmed", auth(), learnController.getConfirmedOrdersController);

// Cancelled orders
router.get("/orders/cancelled", auth(), learnController.getCancelledOrdersController);


export const learnRoutes = router;