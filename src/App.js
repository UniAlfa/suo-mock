import React, { Component } from 'react';
import './App.css';
import {MainRoutes} from './comp/routes/MainRoutes'

import './styles/main.css';


class App extends Component {
    render() {
        return (
            <div className="App">
                <MainRoutes/>
            </div>
        );
    }
}

export default App;
