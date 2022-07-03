import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './Login';
//import Chat from './Chat';

export default function ChatApp(){
  const [view, setView] = React.useState(0);
  function selectView(){
    switch(view){
      case 0: return <Login />
      //case 1: return <Chat />
      default: return <Error />
    }
  }
  return(
    <React.StrictMode>
     
    </React.StrictMode>
  )
}

function Error(){
  return(<p>Error!</p>)
}

// {selectView()}

ReactDOM.createRoot(document.getElementById('root')).render(<ChatApp />);