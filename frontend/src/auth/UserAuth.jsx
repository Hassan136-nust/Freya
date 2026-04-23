import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const UserAuth = ({ children }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (user) {
                setLoading(false);
                return;
            }
            
            if (!token || !user) {
                navigate("/login");
                return;
            }
            
            setLoading(false);
        };
        
        checkAuth();
    }, [token, user, navigate]); // Add proper dependencies

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {children}
        </>
    );
}

export default UserAuth;