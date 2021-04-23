import { interpret } from "xstate";
import { leanHotChocolateMachine } from "./machine";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import http from 'http'
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io"
import path from 'path'

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.post("/event", forwardEvent);
app.use('/', express.static(path.join(__dirname, '../build')))
const server = http.createServer(app)

const io = new Server(server)
io.on('connection', (socket) => {
  console.log('User Connected')
})

let machine = interpret(leanHotChocolateMachine) // Machine instance with internal state
  .onTransition((state) => {
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
