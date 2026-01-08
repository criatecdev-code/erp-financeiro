'use client';

import { createClient } from '../lib/supabase';

// Use this to call our Node API using the user's JWT
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Redirect to login if running in browser
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
    };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://erp-financeiro-rose.vercel.app/api' : 'http://localhost:3001/api');
    const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API Error');
    }

    return res.json();
}

// Call public endpoints without Authentication
export async function fetchPublicApi(endpoint: string, options: RequestInit = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://erp-financeiro-rose.vercel.app/api' : 'http://localhost:3001/api');
    const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API Error');
    }

    return res.json();
}
