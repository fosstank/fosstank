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