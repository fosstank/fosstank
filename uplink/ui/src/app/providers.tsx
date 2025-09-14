// Fosstank: 24/7 live streaming platform
// Copyright (C) 2025 Pierre Morrel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

'use client';

import { createContext, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { pb, User } from "@/lib/pocketbase";
import { toast } from "@/components/toaster";

export const UserContext = createContext<{ user: User | null, setUser: Dispatch<SetStateAction<User | null>> }>({
    user: null,
    setUser: () => { }
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Initialize user state from PocketBase auth store
    useEffect(() => {
        if (pb.authStore.isValid && pb.authStore.record) {
            pb.collection('users').getOne(pb.authStore.record.id).then((user) => {
                setUser(user);
            }).catch((err) => {
                console.error("Failed to fetch user:", err);
                toast.error("Failed to fetch user data. Please log in again.");
                pb.authStore.clear();
                setUser(null);
            });
        }

        // Listen for auth store changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model as User | null);
        });

        return unsubscribe;
    }, []);

    const userRef = useRef(user);
    userRef.current = user;
    const userId = user?.id;
    useEffect(() => {
        if (!userId) { return }

        const unsubscribe = pb.collection("users").subscribe(userId, (e) => {
            const updatedUser = e.record as User;
            setUser(updatedUser);
            if (userRef.current && updatedUser.balance > userRef.current.balance) {
                toast.success(`Received ${(updatedUser.balance - userRef.current.balance).toLocaleString()} tokens.`);
            }
        });

        return () => {
            unsubscribe?.then(unsub => unsub());
        };
    }, [userId])

    return (
        <UserContext.Provider value={{ user: user, setUser: setUser }}>
            {children}
        </UserContext.Provider>
    );
}