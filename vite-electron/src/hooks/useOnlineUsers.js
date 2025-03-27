import { useState, useEffect } from 'react';

const useOnlineUsers = () => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await fetch('/api/users/online');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setOnlineUsers(data.onlineUsers);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineUsers();
    }, []);

    return { onlineUsers, loading, error };
};

export default useOnlineUsers;