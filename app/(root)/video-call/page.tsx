import React from "react";

export default function AudioCallPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: "#f5f6fa",
                overflow: "hidden",
            }}
        >
            {/* Chibi anime character background */}
            <img
                src="https://i.pinimg.com/1200x/8c/98/60/8c9860eea66fd79d3919c4b36802e450.jpg"
                alt="Page not available"
                style={{

                    width: "500px",
                    opacity: 0.18,
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 0,
                }}
            />

            {/* Blurred overlay */}
           

            {/* Message Card - full screen */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    background: "transparent",
                }}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                        padding: "40px 32px",
                        textAlign: "center",
                        maxWidth: "350px",
                        width: "100%",
                    }}
                >
                    <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
                        Page Not Available
                    </h1>
                    <p style={{ color: "#888", fontSize: "1.1rem" }}>
                        Sorry, this page isn&apos;t available yet.<br />
                        Please check back later!
                    </p>
                </div>
            </div>
        </div>
    );
}