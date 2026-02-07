import { NextResponse } from 'next/server';
import { updateProgress } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { userId, count } = await request.json();

        // Simulate DB update
        const updatedUser = await updateProgress(userId, count);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
