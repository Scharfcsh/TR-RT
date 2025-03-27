import { useState, useEffect } from 'react';

const useFetchUsers = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('api/users');
                const data = await response.json();
                
                // Transform the data to the desired format
                const transformedData = data.map((user,index) => ({
                    id: user._id,
                    name: user.fullname
                }));
                console.log("transform",transformedData)
                setUsers(transformedData);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { loading, users };
};

export default useFetchUsers;