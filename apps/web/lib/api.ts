const API_URL = 'http://localhost:4000/api';

export const fetcher = async (endpoint: string, token?: string) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new Error('Gagal memuat data');
    return res.json();
};