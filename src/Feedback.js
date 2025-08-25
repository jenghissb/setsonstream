import "./Feedback.css"
import React, { useState } from 'react';

export const FeedbackButton = ({setFeedbackOpen}) => { 
  //onClick = () => sendFeedback("wow a feedback!")
  return <div className="feedbackButton" onClick={() => setFeedbackOpen(true)}> 
    Feedback
  </div>
}

async function sendFeedback(message, name = '') {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: 'service_kgt2dq7',
        template_id: 'template_kn2unnl',
        user_id: 'j9a4zG42Z4KNP8WKJ',
        template_params: {
          message,
          name: name,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS error: ${errorText}`);
    }
    alert('Feedback sent! Thanks!');
  } catch (error) {
    console.error('Failed to send feedback:', error);
    alert('Oops, something went wrong.');
  }
}

export const FeedbackModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [sending, setSending] = useState(false);

  const sendFeedback = async () => {
    if (!message.trim()) return;

    setSending(true);

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_kgt2dq7',
          template_id: 'template_kn2unnl',
          user_id: 'j9a4zG42Z4KNP8WKJ',
          template_params: {
            message,
            // name: name,
          }
          // service_id: 'your_service_id',
          // template_id: 'your_template_id',
          // user_id: 'your_public_key',
          // template_params: {
          //   message,
          // },
        }),
      });

      setMessage('');
      onClose(); // autoclose
      alert('Thanks for your feedback!'); // or use toast/snackbar
    } catch (err) {
      console.error(err);
      alert('There was an error sending your feedback.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={e => e.stopPropagation()}>
        <h2>Send Feedback</h2>
        <textarea
          placeholder="Write your feedback here..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <label htmlFor="reply-email">Your Email (optional)</label>
        <input
          // className="feedback-email"
          type="email"
          placeholder="Optional: your email if you want a reply"
          value={replyEmail}
          onChange={(e) => setReplyEmail(e.target.value)}
        />
        <div className="feedback-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="submit-btn" onClick={sendFeedback} disabled={sending}>
            {sending ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};
