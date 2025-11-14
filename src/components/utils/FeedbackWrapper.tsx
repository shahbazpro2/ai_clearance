'use client'
import React, { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFeedbackState } from 'use-hook-api';

const FeedbackWrapper = () => {
  const { feedbackState } = useFeedbackState();
  useEffect(() => {
    if (feedbackState) {
      if (feedbackState?.type === 'success') {
        if (Array.isArray(feedbackState?.message)) {
          feedbackState?.message?.map((msg) => toast.success(msg));
        } else {
          toast.success(feedbackState?.message);
        }
      } else if (feedbackState?.type === 'error') {
        console.log(feedbackState?.message);
        if (feedbackState?.message?.[0]?.includes('redirecting')) {
          window.location.href = '/login';
        }
        if (Array.isArray(feedbackState?.message)) {
          feedbackState?.message?.map((msg) => toast.error(msg));
        } else {
          toast.error(feedbackState?.message);
        }
      }
    }
  }, [feedbackState]);

  return (
    <div>
      <ToastContainer position='top-center' autoClose={5000} pauseOnHover theme="colored" />
    </div>
  );
};

export default FeedbackWrapper;
