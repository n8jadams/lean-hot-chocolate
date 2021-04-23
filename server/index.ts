import { interpret } from "xstate";
import { leanHotChocolateMachine } from "./machine";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";

/** @TODO - Establish websocket used for server -> client communication */
/** @TODO - Establish http listeners used for client -> server communication */
/** @TODO - Set up cookies and a way to assign/retrieve user id */

let machine = interpret(leanHotChocolateMachine) // Machine instance with internal state
  .onTransition((state) => {
    console.log("onTransition() ===>", state.value);
    // publish(state)
  })
  .onChange((context) => {
    console.log('onChange() ===>', context);
    // publish(state)
  })
  .start();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.post("/event", forwardEvent);
app.listen(1234, () => {
  console.log(`listening on port 1234`);
});

function forwardEvent(req: Request, res: Response) {
  const setUserId = () => {
    const id = uuidv4();
    res.cookie("lean-hot-chocolate", id);
    return id;
  };
  const getUserId = () => {
    const cookie = req.cookies["lean-hot-chocolate"];
    return cookie;
  };

  machine.send({ ...req.body.event, setUserId, getUserId });
  res.status(200).send();
}
