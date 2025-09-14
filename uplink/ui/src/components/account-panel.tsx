import { useState, useRef, useContext, useEffect } from "react";
import FloatingPanel from "./floating-panel";
import { UserContext } from "@/app/providers";
import Button from "@/components/button";
import { STATIC_ASSETS } from "@/lib/static-assets";
import { Pencil } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { toast } from "./toaster";
import Image from "next/image";


interface AccountPanelProps {
    isOpen?: boolean;
    onClose: () => void;
}

export default function AccountPanel({ isOpen = false, onClose }: AccountPanelProps) {
    const { user, setUser } = useContext(UserContext);
    const [username, setUsername] = useState(user?.username || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync username state with user context
    useEffect(() => {
        setUsername(user?.username || "");
    }, [user]);

    const handleSaveUsername = async () => {
        if (user) {
            try {
                const updatedUser = await pb.collection('users').update(user.id, {
                    username: username
                });
                setUser({ ...user, username: updatedUser.username });
                toast.success("Username saved successfully");
            } catch (error) {
                console.error("Error saving username:", error);
            }
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            try {
                // Create FormData to send the file
                const formData = new FormData();
                formData.append('avatar', file);

                const updatedUser = await pb.collection('users').update(user.id, formData);
                setUser({ ...user, avatar: updatedUser.avatar });
                toast.success("Avatar uploaded successfully");
            } catch (error) {
                console.error("Error uploading avatar:", error);
            }
        }
    };

    const handleLogout = () => {
        pb.authStore.clear();
        toast.success("Logged out successfully");
        onClose();
    };

    return (
        <FloatingPanel isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col space-y-8 p-6">
                <h2 className="text-center text-3xl font-semibold text-white">Account Settings</h2>

                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-gray-200">
                            <Image
                                src={user && user.avatar ? pb.files.getURL(user, user.avatar, { "thumb": "512x512" }) : STATIC_ASSETS.avatar}
                                alt="Avatar"
                                fill={true}
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 shadow-lg group-hover:scale-110"
                            title="Change avatar"
                        >
                            <Pencil size={16} />
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <p className="text-sm text-gray-300 text-center max-w-xs">Click the edit icon to change your avatar</p>
                </div>

                {/* Username Section */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">Username</label>
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-800 text-white"
                            placeholder="Enter username"
                        />
                        <Button
                            onClick={handleSaveUsername}
                            className="px-6 py-3"
                        >
                            Save
                        </Button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 pt-6 border-t border-gray-600">
                    <Button
                        onClick={handleLogout}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold shadow-sm"
                    >
                        Log Out
                    </Button>
                    <Button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </FloatingPanel>
    );
}