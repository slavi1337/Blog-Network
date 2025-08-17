import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";

const CreateAdminForm = ({onAdminCreated}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
        const response = await fetch("/api/admin/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setMessage(data.message);
        setUsername("");
        setPassword("");
        if (onAdminCreated) {
            onAdminCreated();
        }
        } catch (err) {
        setError(err.message);
        } finally {
        setIsSubmitting(false);
    }
  };
};