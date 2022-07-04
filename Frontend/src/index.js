import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Chat from './Chat';

export default function ChatApp(){
    const [info, setInfo] = React.useState({
        view: 0,
        server_url: "http://localhost:8888/",
        server_key: "1033b11e-ea82-11ec-8fea-0242ac120002",
        email: "mail@mail.com_",
        name: "nome",
        user_uid: "33b46c3b-0299-4459-924s-ab5ba7f67f1a",
        step: "server_info",// server_info, user_info
        btn_label: "Próximo",

        status: 'first',
        max_time: null,
        story: null,
        story_id: null,
  
        message: '',
    });
    const sendInfo = {info, setInfo}
    switch(info.view){
        case 0: return <App {...sendInfo}/>
        case 1: return <Chat {...sendInfo}/>
    }
    
}


ReactDOM.createRoot(document.getElementById('root')).render(<ChatApp />)