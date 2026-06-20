import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
render(
  <BrowserRouter basename="/mobile">
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);