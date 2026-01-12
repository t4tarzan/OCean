require('dotenv').config();

async function testOpenAI() {
  console.log('\n🔵 Testing OpenAI API...');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OpenAI works!"' }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI: SUCCESS');
      console.log('   Response:', data.choices[0].message.content);
    } else {
      const error = await response.text();
      console.log('❌ OpenAI: FAILED');
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ OpenAI: ERROR');
    console.log('   ', error.message);
  }
}

async function testClaude() {
  console.log('\n🟣 Testing Claude API...');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Say "Claude works!"' }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Claude: SUCCESS');
      console.log('   Response:', data.content[0].text);
    } else {
      const error = await response.text();
      console.log('❌ Claude: FAILED');
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Claude: ERROR');
    console.log('   ', error.message);
  }
}

async function testGemini() {
  console.log('\n🔴 Testing Gemini API...');
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "Gemini works!"' }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini: SUCCESS');
      console.log('   Response:', data.candidates[0].content.parts[0].text);
    } else {
      const error = await response.text();
      console.log('❌ Gemini: FAILED');
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Gemini: ERROR');
    console.log('   ', error.message);
  }
}

async function testGroq() {
  console.log('\n🟢 Testing Groq API...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say "Groq works!"' }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Groq: SUCCESS');
      console.log('   Response:', data.choices[0].message.content);
    } else {
      const error = await response.text();
      console.log('❌ Groq: FAILED');
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Groq: ERROR');
    console.log('   ', error.message);
  }
}

async function runTests() {
  console.log('🌊 OCEAN API Provider Tests');
  console.log('============================');
  
  await testOpenAI();
  await testClaude();
  await testGemini();
  await testGroq();
  
  console.log('\n============================');
  console.log('✅ All tests completed!\n');
}

runTests();
