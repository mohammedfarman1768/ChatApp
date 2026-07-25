export const api = {
  get: async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  },
};
