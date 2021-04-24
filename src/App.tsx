import React from 'react';
import io from 'socket.io-client'
import { WaitingRoom } from './WaitingRoom'
import { AddingTopics } from './AddingTopics';
import { ContinueVoting } from './ContinueVoting';
import { Discussion } from './Discussion';
import { Lobby } from './Lobby';
import { initialContext, LeanHotChocolateMachineContext } from './machine-types-consts';
import { TopicVoting } from './TopicVoting';
import { send } from './utils'

export function App() {
  const ioRef = React.useRef(io())
  const [ state, setState ] = React.useState('"lobby"')
  const [ context, setContext ] = React.useState<LeanHotChocolateMachineContext>(initialContext)
  const [currentUserId, setCurrentUserId] = React.useState<string>('')

  React.useEffect(() => {
    ioRef.current.on('state change', (msg) => {
      const newState = JSON.parse(msg)
      setState(JSON.stringify(newState.state))
      setContext(newState.context)
    })

    function handleBeforeUnload() {
      send({ type: 'USER_LEFT' })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      // Cleanup is probably not needed...
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  console.log({ state })

  if(!currentUserId) {
    return <WaitingRoom setCurrentUserId={setCurrentUserId} />
  }

  switch(state) {
    case '"lobby"': {
      return <Lobby context={context} currentUserId={currentUserId} setCurrentUserId={setCurrentUserId} />
    }
    case '"addingTopics"': {
      return <AddingTopics context={context} currentUserId={currentUserId} />
    }
    case '"topicVoting"': {
      return <TopicVoting context={context} currentUserId={currentUserId} />
    }
    case '{"discussion":"decrementTimer"}': {
      return <Discussion context={context} />
    }
    case '"continueVoting"': {
      return <ContinueVoting context={context} />
    }
    default: {
      return null
    }
  }
}
