import React from 'react';
import Navbar from '../Components/Navbar';
import { Outlet } from 'react-router-dom';
import Footer from '../Components/Footer';
import TopBar from '../Components/TopBar';
import ChatbotWidget from '../Components/ChatbotWidget';

const CustomerLayout = () => {
  return (
    <div className="customer-site-layout">
      <TopBar />
      <Navbar />
      <Outlet />
      <Footer/>
      <ChatbotWidget />
    </div>
  );
}

export default CustomerLayout;
