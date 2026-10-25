"""
Single-command runner for The Sampling Lab.
Launches FastAPI backend and Vite frontend concurrently.
"""

import subprocess
import sys
import os
import time

def run():
    print("=" * 68)
    print(" 🔬 THE SAMPLING LAB — Text Generation Parameter Explorer")
    print("=" * 68)
    
    # 1. Start FastAPI backend
    print("[1/2] Starting FastAPI backend on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    # 2. Start Vite frontend
    print("[2/2] Starting Vite frontend on http://localhost:5173...")
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )
    
    print("\n Instruments active:")
    print("  ► Frontend Lab Console : http://localhost:5173")
    print("  ► Backend REST API Docs : http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to terminate both servers.")
    print("=" * 68)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down instruments...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    run()
