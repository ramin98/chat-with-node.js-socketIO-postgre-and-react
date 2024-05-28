import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import chatSearch from './assets/messagesearch.png'



const ChatList = ({array}) => {
    
    return (
        <div className='chats'>
            <div className='chats-header'><h1>Chats</h1></div>
            <div className='chats-search'>
                <img src={chatSearch} alt="chatSearch" />
                <input placeholder='Search messenger...' type="text" />
            </div>
            <ul id="list">
                {array.map((item) => (
                    <li key={item}>
                        <NavLink activeClassName="active" to={`/chat/${item.name}`}>
                            <img src={item.image} alt="image" />
                            <div>
                                <h4>{item.name}</h4>
                                <p>Message from {item.name}</p>
                            </div>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatList;
