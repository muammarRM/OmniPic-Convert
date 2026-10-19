"""Automated build script for OmniPic-Convert Windows Executable."""
import subprocess
import sys
import os

def build():
    print("=" * 60)
    print("  OmniPic-Convert — Building Windows Standalone Executable  ")
    print("=" * 60)
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--windowed",
        "--name", "OmniPic-Convert",
        "--collect-all", "customtkinter",
        "--collect-all", "pillow_heif",
        "main.py",
    ]
    
    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd)
    
    if result.returncode == 0:
        exe_path = os.path.abspath(os.path.join("dist", "OmniPic-Convert", "OmniPic-Convert.exe"))
        print("\n" + "=" * 60)
        print("[SUCCESS] BUILD COMPLETE!")
        print(f"Executable Location: {exe_path}")
        print("=" * 60)
    else:
        print("\n[ERROR] Build failed with return code:", result.returncode)
        sys.exit(result.returncode)

if __name__ == "__main__":
    build()
