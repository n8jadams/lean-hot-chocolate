import { interpret } from "xstate";
import { leanHotChocolateMachine } from "./machine";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import http from 'http'
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io"
import path from 'path'

const COOKIE_NAME = "lean-hot-chocolate"

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.post("/event", forwardEvent);
app.use('/', express.static(path.join(__dirname, '../build')))
const server = http.createServer(app)

const io = new Server(server)
// Machine instance with internal state
const machine = interpret(leanHotChocolateMachine)
  .onTransition((state) => {
    console.log(state.context)
    io.emit('state change', JSON.stringify({
      state: state.value,
      context: state.context
    }))
  })
  .start();

server.listen(1234, () => {
  console.log(`listening on port 1234`);
});

function forwardEvent(req: Request, res: Response) {

  const getUserId = () => {
    let cookie = req.cookies[COOKIE_NAME];
    if (!cookie) {
      cookie = uuidv4()
      res.cookie(COOKIE_NAME, cookie)
    }
    return cookie;
  };

  const currentUserId = getUserId()
  machine.send({ ...req.body.event, currentUserId });
  res.status(200).send({ userId: currentUserId });
}
