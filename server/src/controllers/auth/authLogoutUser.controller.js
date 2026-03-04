// Logout User - This will allow both Employees and Admins to log out by clearing the authentication cookie.
export const logoutUser = async (req, res) => {
    try {
        // Clear the cookie by setting its expiration to the past
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), // Sets expiration to 1970 (immediate expiry)
            sameSite: 'lax',
            secure: false // Set to true in production
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error during logout" });
    }
};