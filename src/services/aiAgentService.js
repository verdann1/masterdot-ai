const API_URL = "http://192.168.1.104:3001";

export async function askAiChat({
  question,
  tasks,
  projects,
}) {
  const response = await fetch(
    `${API_URL}/ai/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        tasks,
        projects,
      }),
    }
  );

  return response.json();
}

export async function askAiPrioritize({
  tasks,
  projects,
}) {
  const response = await fetch(
    `${API_URL}/ai/prioritize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks,
        projects,
      }),
    }
  );

  return response.json();
}

export async function askAiPlan({
  task,
  tasks,
  projects,
}) {
  const response = await fetch(
    `${API_URL}/ai/plan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        tasks,
        projects,
      }),
    }
  );

  return response.json();
}