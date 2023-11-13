import React, { useState } from 'react';
import { run } from './index';

const App = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    const response = await run(question);
    setAnswer(response);
  };
  return (
    <div>
      <form onSubmit={handleQuestionSubmit}>
        <label>
          質問:
          <input type="text" value={question} onChange={handleQuestionChange} />
        </label>
        <input type="submit" value="送信" />
      </form>
      <p>回答: {answer}</p>
    </div>
  );
};

export default App;