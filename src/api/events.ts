export type MyEvent = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
};

export async function fetchEvents(token: string): Promise<MyEvent[]> {
  const startDate = new Date().toISOString();
  const url = `https://api.portals.now/events/date-range?startDate=${startDate}&page=1&limit=9999`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await response.json();
  return data.content as MyEvent[];
}
