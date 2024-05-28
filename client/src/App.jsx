import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import './App.css'
import person1 from './assets/messagesearch.png'
import person2 from './assets/01-11(1).jpg'
import person3 from './assets/720x720_0xac120003_13730406881612364823.jpg'

const App = () => {
  const array = [{name:"Sahib", image:person1}, {name:"Fidan", image:person2}, {name:"Elvin", image:person3}];

  return (
    <Router>
      <div className='app'>
        <ChatList array={array}  />
        <Routes>
          <Route  path="/chat/:chatId" element={<ChatWindow array={array}/>} />
        </Routes>
      </div>
    </Router >

  );
};

export default App;
