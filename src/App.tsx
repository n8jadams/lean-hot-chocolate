import React from 'react';
import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client'

/*
Expected states

lobby
addingTopics
topicVoting
{"discussion":"decrementTimer"}
continueVoting


*/

let socket = io()

socket.on('state change', (msg) => {

})

function App() {
  return (
    <div className="App">
      <header className="App-header">
        Hello
      </header>
    </div>
  );
}

export default App;
