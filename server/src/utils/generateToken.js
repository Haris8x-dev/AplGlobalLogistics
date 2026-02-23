import jwt from 'jsonwebtoken';

const generateToken = (userId, role) => {
    // We handle the secret check here
    const secret = process.env.JWT_SECRET || "fallback_secret_key_123";

    return jwt.sign(
        { userId, role },
        secret,
        { expiresIn: '1d' }
    );
};

export default generateToken;