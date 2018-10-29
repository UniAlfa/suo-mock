import React from 'react';

class HomePage extends React.Component {

    componentWillMount(){
        this.props.history.replace('/suo.htm');
    }

    render() {

        return (
            <React.Fragment>
                Стартовая страница
            </React.Fragment>

        );
    }
}

export default HomePage;
