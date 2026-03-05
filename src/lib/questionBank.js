const questionBank = {
  python: {
    mcq: [
      { id: 1, question: 'What is the output of print(type([]))?', options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], correct: 0, difficulty: 'easy' },
      { id: 2, question: 'Which keyword is used to create a generator in Python?', options: ['generate', 'yield', 'return', 'async'], correct: 1, difficulty: 'medium' },
      { id: 3, question: 'What does the GIL stand for in Python?', options: ['Global Interpreter Lock', 'General Input Layer', 'Global Index List', 'Generated Instruction Lock'], correct: 0, difficulty: 'hard' },
      { id: 4, question: 'Which data structure uses LIFO ordering?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correct: 1, difficulty: 'easy' },
      { id: 5, question: 'What is the time complexity of dictionary lookup in Python?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], correct: 2, difficulty: 'medium' },
      { id: 6, question: 'Which of the following is immutable in Python?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correct: 3, difficulty: 'easy' },
      { id: 7, question: 'What does *args do in a function definition?', options: ['Creates a dictionary of arguments', 'Creates a tuple of positional arguments', 'Creates a list of arguments', 'Creates keyword arguments'], correct: 1, difficulty: 'medium' },
      { id: 8, question: 'Which method resolves the diamond problem in Python?', options: ['DFS', 'BFS', 'MRO (C3 Linearization)', 'Random'], correct: 2, difficulty: 'hard' },
      { id: 9, question: 'What is a decorator in Python?', options: ['A design pattern', 'A function that modifies another function', 'A class method', 'A type annotation'], correct: 1, difficulty: 'medium' },
      { id: 10, question: 'Which module is used for regular expressions in Python?', options: ['regex', 're', 'regexp', 'pattern'], correct: 1, difficulty: 'easy' },
      { id: 11, question: 'What is the output of bool("")?', options: ['True', 'False', 'None', 'Error'], correct: 1, difficulty: 'easy' },
      { id: 12, question: 'How do you handle exceptions in Python?', options: ['if/else', 'try/except', 'catch/throw', 'handle/error'], correct: 1, difficulty: 'easy' },
    ],
    scenario: [
      { id: 101, question: 'You need to process a 10GB CSV file in Python. The file is too large to fit in memory. Describe your approach and which tools/techniques you would use.', rubric: 'Should mention chunked reading, generators, pandas chunksize, or dask. Bonus for mentioning memory mapping.' },
      { id: 102, question: 'A web API you depend on is rate-limited to 100 requests per minute. You need to make 10,000 requests. How would you design this in Python?', rubric: 'Should mention asyncio/aiohttp or threading, rate limiting with sleep/semaphore, retry logic, and queue management.' },
      { id: 103, question: 'You discover a memory leak in a long-running Python application. Walk through your debugging process.', rubric: 'Should mention tools like tracemalloc, objgraph, gc module, profiling, and common causes like circular references.' },
    ],
    explanation: [
      { id: 201, question: 'Explain the difference between shallow copy and deep copy in Python. When would you use each?', rubric: 'Must explain reference vs value copying, nested objects behavior, copy module usage, and practical use cases.' },
      { id: 202, question: 'Explain Python context managers and the "with" statement. Give a practical example beyond file handling.', rubric: 'Must explain __enter__/__exit__, resource management, contextlib, and a non-file example like database connections.' },
    ]
  },
  javascript: {
    mcq: [
      { id: 1, question: 'What is the output of typeof null?', options: ['null', 'undefined', 'object', 'boolean'], correct: 2, difficulty: 'medium' },
      { id: 2, question: 'Which method creates a new array from an existing one?', options: ['push()', 'map()', 'splice()', 'pop()'], correct: 1, difficulty: 'easy' },
      { id: 3, question: 'What is a closure in JavaScript?', options: ['A way to close browser windows', 'A function with access to its outer scope', 'A loop construct', 'An error handler'], correct: 1, difficulty: 'medium' },
      { id: 4, question: 'What does the "===" operator check?', options: ['Only value', 'Only type', 'Value and type', 'Reference'], correct: 2, difficulty: 'easy' },
      { id: 5, question: 'Which is NOT a JavaScript data type?', options: ['Symbol', 'BigInt', 'Float', 'undefined'], correct: 2, difficulty: 'medium' },
      { id: 6, question: 'What is event bubbling?', options: ['Events propagate from child to parent', 'Events propagate from parent to child', 'Events are cancelled', 'Events are delayed'], correct: 0, difficulty: 'medium' },
      { id: 7, question: 'What does Promise.all() return if one promise rejects?', options: ['All resolved values', 'A rejected promise', 'Partial results', 'undefined'], correct: 1, difficulty: 'medium' },
      { id: 8, question: 'What is the purpose of the "use strict" directive?', options: ['Enable debugging', 'Enable strict mode with error reporting', 'Enable TypeScript', 'Enable module mode'], correct: 1, difficulty: 'easy' },
      { id: 9, question: 'Which ES6 feature allows destructuring?', options: ['let/const', 'Arrow functions', 'Pattern matching syntax', 'Template literals'], correct: 2, difficulty: 'medium' },
      { id: 10, question: 'What is the event loop responsible for?', options: ['Managing CSS animations', 'Executing async callbacks', 'Memory allocation', 'DOM rendering'], correct: 1, difficulty: 'hard' },
      { id: 11, question: 'What does Array.prototype.reduce() do?', options: ['Removes elements', 'Reduces array to single value', 'Sorts the array', 'Filters elements'], correct: 1, difficulty: 'easy' },
      { id: 12, question: 'What is hoisting in JavaScript?', options: ['Moving DOM elements', 'Moving declarations to top of scope', 'Lazy loading', 'Code splitting'], correct: 1, difficulty: 'medium' },
    ],
    scenario: [
      { id: 101, question: 'Your web app has a performance bottleneck where a large list (50,000 items) is rendering slowly. How would you optimize the rendering in a React/JS application?', rubric: 'Should mention virtual scrolling, pagination, memoization, windowing libraries, debouncing, and avoiding unnecessary re-renders.' },
      { id: 102, question: 'Design a debounce function that limits how often a search API is called as a user types. Explain your approach.', rubric: 'Should explain setTimeout/clearTimeout pattern, leading vs trailing edge, practical considerations like cancellation.' },
      { id: 103, question: 'A Node.js API endpoint is causing memory leaks under heavy load. How do you diagnose and fix it?', rubric: 'Should mention heap snapshots, --inspect flag, event listener cleanup, stream handling, and proper connection pooling.' },
    ],
    explanation: [
      { id: 201, question: 'Explain the JavaScript event loop, including microtasks and macrotasks. How does async/await interact with it?', rubric: 'Must cover call stack, task queue, microtask queue, Promise resolution timing, and async/await desugaring.' },
      { id: 202, question: 'Explain prototypal inheritance in JavaScript and how it differs from classical inheritance.', rubric: 'Must cover prototype chain, Object.create, constructor functions, ES6 class syntax as sugar, and __proto__.' },
    ]
  },
  react: {
    mcq: [
      { id: 1, question: 'What hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useMemo'], correct: 1, difficulty: 'easy' },
      { id: 2, question: 'What is the virtual DOM?', options: ['A copy of the real DOM in memory', 'A browser API', 'A CSS engine', 'A testing tool'], correct: 0, difficulty: 'easy' },
      { id: 3, question: 'Which pattern is used to share logic between components?', options: ['Higher-Order Components', 'CSS Modules', 'Server Components', 'Web Workers'], correct: 0, difficulty: 'medium' },
      { id: 4, question: 'What does React.memo() do?', options: ['Creates memos', 'Memoizes component render', 'Stores global state', 'Creates context'], correct: 1, difficulty: 'medium' },
      { id: 5, question: 'What is the purpose of keys in React lists?', options: ['Styling', 'Identification for reconciliation', 'Event handling', 'Accessibility'], correct: 1, difficulty: 'easy' },
      { id: 6, question: 'Which hook replaces componentDidMount in functional components?', options: ['useState', 'useEffect with []', 'useRef', 'useCallback'], correct: 1, difficulty: 'easy' },
      { id: 7, question: 'What is prop drilling?', options: ['A testing technique', 'Passing props through many levels', 'A build process', 'A routing method'], correct: 1, difficulty: 'medium' },
      { id: 8, question: 'What is the purpose of useCallback?', options: ['Create callbacks', 'Memoize callback functions', 'Handle errors', 'Manage routing'], correct: 1, difficulty: 'medium' },
      { id: 9, question: 'What is Concurrent Mode in React?', options: ['Running two React apps', 'Interruptible rendering', 'Server-side rendering', 'Multi-threading'], correct: 1, difficulty: 'hard' },
      { id: 10, question: 'What triggers a re-render in React?', options: ['State or props change', 'CSS change', 'URL change', 'Window resize'], correct: 0, difficulty: 'easy' },
      { id: 11, question: 'What is a controlled component?', options: ['A component with ref', 'Form element controlled by React state', 'A purely visual component', 'A component with error boundary'], correct: 1, difficulty: 'medium' },
      { id: 12, question: 'What does useRef return?', options: ['A state variable', 'A mutable ref object', 'A callback function', 'A context value'], correct: 1, difficulty: 'easy' },
    ],
    scenario: [
      { id: 101, question: 'A React application re-renders excessively, causing lag. Walk through how you would diagnose and optimize it.', rubric: 'Should mention React DevTools Profiler, useMemo, useCallback, React.memo, identifying wasted renders, state colocation.' },
      { id: 102, question: 'Design a form system in React that handles validation, error display, and submission for a complex multi-step wizard.', rubric: 'Should mention controlled components, custom hooks, validation libraries, step state management, and error boundaries.' },
      { id: 103, question: 'How would you implement real-time data updates in a React dashboard without overwhelming the browser?', rubric: 'Should mention WebSockets/SSE, throttling/debouncing updates, virtual lists, selective re-rendering, web workers.' },
    ],
    explanation: [
      { id: 201, question: 'Explain the React reconciliation algorithm and how it decides what to update in the DOM.', rubric: 'Must cover diffing algorithm, key role, component type comparison, fiber architecture basics, and batching.' },
      { id: 202, question: 'Compare and contrast React Server Components with traditional SSR. What problems do RSCs solve?', rubric: 'Must cover zero JS bundle for server components, streaming, suspense, data fetching patterns, and bundle size benefits.' },
    ]
  }
};

// Generic fallback for unknown skills
const genericQuestions = {
  mcq: [
    { id: 1, question: 'What is the most important factor in learning a new technical skill?', options: ['Memorizing syntax', 'Understanding concepts and practice', 'Reading documentation only', 'Watching videos'], correct: 1, difficulty: 'easy' },
    { id: 2, question: 'Which approach is best for debugging a complex problem?', options: ['Random changes', 'Systematic isolation', 'Rewriting from scratch', 'Ignoring it'], correct: 1, difficulty: 'easy' },
    { id: 3, question: 'What does version control help with?', options: ['Running code faster', 'Tracking changes and collaboration', 'Writing tests', 'Deploying applications'], correct: 1, difficulty: 'easy' },
    { id: 4, question: 'What is the DRY principle?', options: ['Delete Redundant YAML', 'Do not Repeat Yourself', 'Deploy Run Yield', 'Debug Review Yank'], correct: 1, difficulty: 'easy' },
    { id: 5, question: 'Which is a benefit of code reviews?', options: ['Slower development', 'Knowledge sharing and quality', 'More meetings', 'Less documentation'], correct: 1, difficulty: 'easy' },
    { id: 6, question: 'What is technical debt?', options: ['Money owed for software', 'Shortcuts that need future fixing', 'Server costs', 'License fees'], correct: 1, difficulty: 'medium' },
    { id: 7, question: 'What is the purpose of automated testing?', options: ['Replace developers', 'Catch regressions early', 'Write documentation', 'Deploy code'], correct: 1, difficulty: 'easy' },
    { id: 8, question: 'What is an API?', options: ['A Programming Interface', 'Application Programming Interface', 'Automated Process Integration', 'App Platform Index'], correct: 1, difficulty: 'easy' },
    { id: 9, question: 'What is meant by "scalability"?', options: ['Making code prettier', 'Ability to handle growing demand', 'Adding more features', 'Writing more tests'], correct: 1, difficulty: 'medium' },
    { id: 10, question: 'What is pair programming?', options: ['Using two monitors', 'Two developers working together on one task', 'Writing code in pairs of files', 'Deploying two versions'], correct: 1, difficulty: 'easy' },
    { id: 11, question: 'What does CI/CD stand for?', options: ['Code Integration/Code Deployment', 'Continuous Integration/Continuous Delivery', 'Central Interface/Central Database', 'Client Integration/Client Delivery'], correct: 1, difficulty: 'medium' },
    { id: 12, question: 'Which is a key principle of good software architecture?', options: ['Maximum complexity', 'Separation of concerns', 'Global variables everywhere', 'No documentation'], correct: 1, difficulty: 'easy' },
  ],
  scenario: [
    { id: 101, question: 'You are tasked with teaching this skill to a beginner with no background knowledge. Describe how you would structure a 1-hour teaching session.', rubric: 'Should include an outline with intro, core concepts, hands-on exercises, and recap. Should mention adapting to learner pace.' },
    { id: 102, question: 'A student you are mentoring is stuck on a problem and has tried multiple approaches. How do you guide them without giving the answer directly?', rubric: 'Should mention Socratic method, asking guiding questions, breaking down the problem, and building on what they know.' },
    { id: 103, question: 'Describe a real project where you applied this skill. What challenges did you face and how did you solve them?', rubric: 'Should provide specific technical details, problem-solving approach, tools used, and lessons learned.' },
  ],
  explanation: [
    { id: 201, question: 'Explain the fundamental concepts of this skill that every practitioner must understand. What separates a beginner from an expert?', rubric: 'Should cover core principles, common patterns, growth path, and real-world application differences.' },
    { id: 202, question: 'What are the most common mistakes that beginners make in this field, and how should they be avoided?', rubric: 'Should list specific mistakes with clear explanations and preventive strategies.' },
  ]
};

export function getQuestionsForSkill(skillName) {
  const key = skillName.toLowerCase().trim();
  const bank = questionBank[key] || genericQuestions;

  // Select 10 MCQs randomly
  const shuffled = [...bank.mcq].sort(() => Math.random() - 0.5);
  const mcqs = shuffled.slice(0, 10);

  // Select 2 scenarios randomly
  const scenarios = [...bank.scenario].sort(() => Math.random() - 0.5).slice(0, 2);

  // Select 1 explanation randomly
  const explanations = [...bank.explanation].sort(() => Math.random() - 0.5).slice(0, 1);

  return {
    mcq: mcqs.map((q, i) => ({ ...q, questionNumber: i + 1, questionType: 'mcq' })),
    scenario: scenarios.map((q, i) => ({ ...q, questionNumber: 11 + i, questionType: 'scenario' })),
    explanation: explanations.map((q, i) => ({ ...q, questionNumber: 13 + i, questionType: 'explanation' })),
    totalQuestions: 13,
    timeLimit: 1800,
    skillName
  };
}

export function gradeMCQ(question, selectedAnswer) {
  return parseInt(selectedAnswer) === question.correct;
}

export default questionBank;
