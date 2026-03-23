import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const response = NextResponse.next();

        // Add cache control headers to prevent caching of protected routes
        // This fixes the issue where clicking "back" shows the dashboard after logout
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");

        return response;
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/profile/:path*",
        "/api/demands/:path*",
        // Add other protected routes here
    ],
};
