import React from 'react';
import Navbar from '../Components/Navbar';
import { Outlet } from 'react-router-dom';
import Footer from '../Components/Footer';
import TopBar from '../Components/TopBar';

const CustomerLayout = () => {
  return (
    <div>
      <TopBar />
      <Navbar />
      <Outlet />
      <Footer/>
    </div>
  );
}

export default CustomerLayout;
