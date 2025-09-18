#!/usr/bin/env python3
"""
Script to run the FastAPI backend on the local network
This allows mobile devices on the same WiFi to connect
"""

import uvicorn
import socket
import sys

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Connect to a remote server to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        return local_ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    # Get the local IP address
    local_ip = get_local_ip()
    port = 8000
    
    print(f"🚀 Starting FastAPI server...")
    print(f"📱 Local IP: {local_ip}")
    print(f"🔌 Port: {port}")
    print(f"🌐 Server will be available at: http://{local_ip}:{port}")
    print(f"📱 Update your mobile app's API_BASE to: http://{local_ip}:{port}")
    print(f"🔗 API Documentation: http://{local_ip}:{port}/docs")
    print("=" * 60)
    
    try:
        # Run the server on all interfaces (0.0.0.0) so it's accessible from other devices
        uvicorn.run(
            "main:app",
            host="0.0.0.0",  # This makes it accessible from other devices on the network
            port=port,
            reload=True,  # Auto-reload on code changes
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)




