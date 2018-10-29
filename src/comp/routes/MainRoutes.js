import React from 'react';
import { Switch, Route } from 'react-router-dom'
import HomePage from '../mockye/Home';
import {SuoMockedPage} from '../mockye/SuoMockedPage';

import {page404} from '../shared/err/page404';


export const MainRoutes =() => (
    <React.Fragment>
        <Switch>
            <Route exact path="/" component={HomePage}/>
            {/*<Route exact path="/suo" component={SuoMockedPage}/>*/}
            <Route path='/suo.htm' component={() => window.location = '/suo.htm'}/>
            {/*<Route path="*" component={page404} />*/}

        </Switch>
    </React.Fragment>
);
