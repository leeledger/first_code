// Mock Database for development
// In a real project, this would use Prisma, Supabase, or MongoDB.

export interface UserProgress {
    userId: string;
    totalFlowers: number;
    unlockedModules: string[];
    lastActive: Date;
}

let mockDB: UserProgress[] = [
    {
        userId: 'senior-001',
        totalFlowers: 42,
        unlockedModules: ['module-1'],
        lastActive: new Date()
    }
];

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
    return mockDB.find(u => u.userId === userId) || null;
}

export async function updateProgress(userId: string, bloomCount: number) {
    const user = mockDB.find(u => u.userId === userId);
    if (user) {
        user.totalFlowers += bloomCount;
        user.lastActive = new Date();
        return user;
    }
    return null;
}
