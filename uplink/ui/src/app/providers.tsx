'use client';

import { createContext, Dispatch, SetStateAction, useEffect, useState } from "react";
import { pb, User } from "@/lib/pocketbase";

export const UserContext = createContext<{ user: User | null, setUser: Dispatch<SetStateAction<User | null>> }>({
    user: null,
    setUser: () => { }
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Initialize user state from PocketBase auth store
    useEffect(() => {
        if (pb.authStore.isValid) {
            setUser(pb.authStore.record as User);
        }
    }, []);

    return (
        <UserContext value={{ user: user, setUser: setUser }}>
            {children}
        </UserContext>
    );
}