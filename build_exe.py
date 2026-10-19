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
        "--onefile",
        "--windowed",
        "--name", "OmniPic-Convert",
        "--collect-all", "customtkinter",
        "--collect-all", "pillow_heif",
        "main.py",
    ]
    
    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd)
    
    if result.returncode == 0:
        exe_path = os.path.abspath(os.path.join("dist", "OmniPic-Convert.exe"))
        # Copy to root folder for instant access
        root_exe = os.path.abspath("OmniPic-Convert.exe")
        try:
            import shutil
            shutil.copy2(exe_path, root_exe)
            print(f"Copied standalone executable to root: {root_exe}")
        except Exception as e:
            print(f"Note: Could not copy to root: {e}")

        print("\n" + "=" * 60)
        print("[SUCCESS] STANDALONE ONE-FILE BUILD COMPLETE!")
        print(f"Executable Location: {exe_path}")
        print(f"Root Executable:     {root_exe}")
        print("=" * 60)
    else:
        print("\n[ERROR] Build failed with return code:", result.returncode)
        sys.exit(result.returncode)

if __name__ == "__main__":
    build()
