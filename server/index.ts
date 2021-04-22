import { interpret } from 'xstate'
import { leanHotChocolateMachine } from './machine'

/** @TODO - Establish websocket used for server -> client communication */
/** @TODO - Establish http listeners used for client -> server communication */
/** @TODO - Set up cookies and a way to assign/retrieve user id */

// Machine instance with internal state
const toggleService = interpret(leanHotChocolateMachine)
  .onTransition((state) => {
    // publish(state)
  })
  .onChange((state) => {
    // publish(state)
  })
  .start()
