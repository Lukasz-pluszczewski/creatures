import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './styles/index.scss';
import App from './components/App/App';

if (process.env.REACT_APP_ENV !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
